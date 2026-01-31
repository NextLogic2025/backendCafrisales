import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, PrioridadNotificacion } from './entities/notification.entity';
import { CreateNotificationDto, QueryNotificationsDto } from './dto/notification.dto';
import { PreferenciaNotificacion } from './entities/preferencia-notificacion.entity';
import { SuscripcionNotificacion } from './entities/suscripcion-notificacion.entity';
import { HistorialEnvio, CanalNotificacion } from './entities/historial-envio.entity';
import { Outbox } from './entities/outbox.entity';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { PaginatedResponse, createPaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import { NotificationFilterDto } from './dto/notification-filter.dto';
@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(
        @InjectRepository(Notification)
        private readonly notificationRepo: Repository<Notification>,
        @InjectRepository(PreferenciaNotificacion)
        private readonly prefRepo: Repository<PreferenciaNotificacion>,
        @InjectRepository(SuscripcionNotificacion)
        private readonly subsRepo: Repository<SuscripcionNotificacion>,
        @InjectRepository(HistorialEnvio)
        private readonly historialRepo: Repository<HistorialEnvio>,
        @InjectRepository(Outbox)
        private readonly outboxRepo: Repository<Outbox>,
    ) { }

    async create(dto: CreateNotificationDto): Promise<Notification> {
        if (!dto || !dto.usuarioId) {
            this.logger.warn('Intento de crear notificación sin usuarioId', dto ?? {});
            throw new BadRequestException('usuarioId requerido para crear notificación');
        }

        // Resolver preferencias y suscripciones
        const [pref, sub] = await Promise.all([
            this.prefRepo.findOne({ where: { usuarioId: dto.usuarioId } }),
            this.subsRepo.findOne({ where: { usuarioId: dto.usuarioId, tipoId: dto.tipoId } }),
        ]);

        // Decidir canales: suscripcion override NULL = usar preferencia, otherwise use forced value
        const websocketEnabled = sub?.websocketEnabled ?? pref?.websocketEnabled ?? true;
        const emailEnabled = sub?.emailEnabled ?? pref?.emailEnabled ?? false;
        const smsEnabled = sub?.smsEnabled ?? pref?.smsEnabled ?? false;

        // Insertar notificación de manera idempotente por origen.
        // Algunos despliegues usan un índice único parcial en (origen_servicio, origen_evento_id, usuario_id)
        // con predicate WHERE origen_evento_id IS NOT NULL. Para evitar errores de "could not infer
        // arbiter indexes" cuando usamos ON CONFLICT, hacemos un INSERT condicionado con NOT EXISTS.
        const insertSql = `
            WITH ins AS (
                INSERT INTO app.notificaciones (
                    usuario_id, tipo_id, titulo, mensaje, payload,
                    origen_servicio, origen_evento_id, prioridad, requiere_accion, url_accion, creado_por
                )
                SELECT $1::uuid, $2::uuid, $3::varchar, $4::text, $5::jsonb,
                       $6::varchar, $7::uuid, $8::prioridad_notificacion, $9::boolean, $10::text, $11::uuid
                WHERE NOT EXISTS (
                    SELECT 1 FROM app.notificaciones
                    WHERE origen_servicio = $6
                      AND origen_evento_id = $7
                      AND usuario_id = $1
                      AND origen_evento_id IS NOT NULL
                )
                RETURNING *
            )
            SELECT * FROM ins;
        `;

        const params = [
            dto.usuarioId,
            dto.tipoId,
            dto.titulo,
            dto.mensaje,
            JSON.stringify(dto.payload ?? {}),
            dto.origenServicio,
            dto.origenEventoId ?? null,
            dto.prioridad ?? PrioridadNotificacion.NORMAL,
            dto.requiereAccion ?? false,
            dto.urlAccion ?? null,
            (dto as any).creadoPor ?? null,
        ];

        const insertResult = await this.notificationRepo.manager.query(insertSql, params);

        let saved: Notification | null = null;
        if (Array.isArray(insertResult) && insertResult.length > 0) {
            // insertResult is a raw row with snake_case columns (e.g. usuario_id).
            // To ensure entity mapping (camelCase) and relations, re-load the entity by id.
            const inserted = insertResult[0] as any;
            const insertedId = inserted.id ?? inserted.id;
            if (insertedId) {
                saved = await this.notificationRepo.findOne({ where: { id: insertedId } });
            } else {
                // Fallback: map common snake_case -> camelCase
                saved = {
                    id: inserted.id,
                    usuarioId: inserted.usuario_id ?? inserted.usuarioId,
                    tipoId: inserted.tipo_id ?? inserted.tipoId,
                    titulo: inserted.titulo ?? inserted.title,
                    mensaje: inserted.mensaje ?? inserted.message,
                    payload: inserted.payload,
                    prioridad: inserted.prioridad ?? inserted.priority,
                    requiereAccion: inserted.requiere_accion ?? inserted.requiereAccion,
                    urlAccion: inserted.url_accion ?? inserted.urlAccion,
                    creadoEn: inserted.creado_en ?? inserted.creadoEn,
                } as unknown as Notification;
            }
        } else {
            // No se insertó porque ya existía (origen_evento_id no nulo). Recuperar la existente.
            saved = await this.notificationRepo.findOne({ where: { origenServicio: dto.origenServicio, origenEventoId: dto.origenEventoId ?? null, usuarioId: dto.usuarioId } });
        }

        if (!saved) {
            // Fallback: create via repo.save (shouldn't normally happen)
            const notification = this.notificationRepo.create({
                usuarioId: dto.usuarioId,
                tipoId: dto.tipoId,
                titulo: dto.titulo,
                mensaje: dto.mensaje,
                payload: dto.payload ?? {},
                origenServicio: dto.origenServicio,
                origenEventoId: dto.origenEventoId ?? null,
                prioridad: dto.prioridad ?? PrioridadNotificacion.NORMAL,
                requiereAccion: dto.requiereAccion ?? false,
                urlAccion: dto.urlAccion ?? null,
            });
            saved = await this.notificationRepo.save(notification);
        }

        this.logger.log(`Notificación creada/resuelta: ${saved.id} para usuario ${saved.usuarioId}`);

        // Crear evento outbox para procesadores de delivery (email/sms) y tracking
        const outboxPayload = {
            notificacion_id: saved.id,
            canales: {
                websocket: websocketEnabled,
                email: emailEnabled,
                sms: smsEnabled,
            },
        };

        const outbox = this.outboxRepo.create({
            agregado: 'notification',
            tipoEvento: 'NotificacionCreada',
            claveAgregado: saved.id,
            payload: outboxPayload,
        });
        await this.outboxRepo.save(outbox);

        return saved;
    }

    async findAllPaginated(pagination: PaginationQueryDto, filters: NotificationFilterDto, usuarioId: string): Promise<PaginatedResponse<Notification>> {
        const qb = this.notificationRepo.createQueryBuilder('n');

        qb.where('n.usuario_id = :usuarioId', { usuarioId });

        if (filters.isRead !== undefined) {
            console.log('Applying isRead filter:', filters.isRead); // DEBUG
            qb.andWhere('n.leida = :isRead', { isRead: filters.isRead });
        }

        if (filters.typeId) {
            qb.andWhere('n.tipo_id = :typeId', { typeId: filters.typeId });
        }

        if (filters.priority) {
            qb.andWhere('n.prioridad = :priority', { priority: filters.priority });
        }

        if (filters.fromDate) {
            qb.andWhere('n.creado_en >= :fromDate', { fromDate: filters.fromDate });
        }

        if (filters.toDate) {
            qb.andWhere('n.creado_en <= :toDate', { toDate: filters.toDate });
        }

        const sortField = ['creado_en', 'prioridad'].includes(pagination.sortBy)
            ? `n.${pagination.sortBy}`
            : 'n.creado_en';
        qb.orderBy(sortField, pagination.sortOrder);

        qb.skip(pagination.skip).take(pagination.take);

        const [data, total] = await qb.getManyAndCount();
        const unreadCount = await this.getUnreadCount(usuarioId);

        return createPaginatedResponse(data, total, pagination.page, pagination.limit, unreadCount);
    }

    async findAll(query: QueryNotificationsDto): Promise<Notification[]> {
        // Keeping for backward compatibility if needed, but implementation updated to use new logic if possible or just basics
        const qb = this.notificationRepo.createQueryBuilder('n');

        if (query.usuarioId) {
            qb.where('n.usuario_id = :usuarioId', { usuarioId: query.usuarioId });
        }

        if (query.tipoId) {
            qb.andWhere('n.tipo_id = :tipoId', { typeId: query.tipoId });
        }

        if (query.soloNoLeidas) {
            qb.andWhere('n.leida = false');
        }

        qb.orderBy('n.creado_en', 'DESC');
        qb.limit(query.limit ?? 50);

        return qb.getMany();
    }

    async findOne(id: string): Promise<Notification> {
        const notification = await this.notificationRepo.findOne({ where: { id } });
        if (!notification) {
            throw new NotFoundException(`Notificación ${id} no encontrada`);
        }
        return notification;
    }

    async markAsRead(id: string): Promise<Notification> {
        const notification = await this.findOne(id);
        notification.leida = true;
        notification.leidaEn = new Date();
        return this.notificationRepo.save(notification);
    }

    async getUnreadCount(usuarioId: string): Promise<number> {
        return this.notificationRepo.count({
            where: { usuarioId, leida: false },
        });
    }

    async markAsReadBatch(usuarioId: string, ids: string[], isRead: boolean): Promise<void> {
        if (!ids.length) return;

        await this.notificationRepo.createQueryBuilder()
            .update(Notification)
            .set({
                leida: isRead,
                leidaEn: isRead ? new Date() : null
            })
            .where('id IN (:...ids)', { ids })
            .andWhere('usuario_id = :usuarioId', { usuarioId })
            .execute();
    }

    async markAllAsRead(usuarioId: string): Promise<void> {
        await this.notificationRepo.update(
            { usuarioId, leida: false },
            { leida: true, leidaEn: new Date() },
        );
    }

    /** Registrar intento de envío en historial_envios */
    async recordHistorial(notificacionId: string, canal: CanalNotificacion, exitoso: boolean, errorMensaje?: string): Promise<void> {
        const entry = this.historialRepo.create({
            notificacionId,
            canal,
            exitoso,
            errorMensaje: errorMensaje ?? null,
        });
        await this.historialRepo.save(entry);
    }

    /** Obtener suscripciones del usuario con datos del tipo */
    async getSubscriptions(usuarioId: string): Promise<any[]> {
        const subs = await this.subsRepo.find({ where: { usuarioId }, relations: ['tipo'] });
        return subs.map(s => ({
            tipoId: s.tipoId,
            tipoCodigo: s.tipo?.codigo ?? null,
            tipoNombre: s.tipo?.nombre ?? null,
            websocketEnabled: s.websocketEnabled,
            emailEnabled: s.emailEnabled,
            smsEnabled: s.smsEnabled,
        }));
    }

    /** Upsert (insert or update) suscripción para un usuario y tipo */
    async upsertSubscription(usuarioId: string, data: { tipoId: string; websocketEnabled?: boolean | null; emailEnabled?: boolean | null; smsEnabled?: boolean | null; }): Promise<void> {
        const entity = this.subsRepo.create({
            usuarioId,
            tipoId: data.tipoId,
            websocketEnabled: typeof data.websocketEnabled === 'undefined' ? null : data.websocketEnabled,
            emailEnabled: typeof data.emailEnabled === 'undefined' ? null : data.emailEnabled,
            smsEnabled: typeof data.smsEnabled === 'undefined' ? null : data.smsEnabled,
        });

        // save will insert or update because primary keys provided
        await this.subsRepo.save(entity);
    }

    async remove(id: string): Promise<void> {
        await this.notificationRepo.softDelete(id);
    }
}

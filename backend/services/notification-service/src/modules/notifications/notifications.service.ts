import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, PrioridadNotificacion } from './entities/notification.entity';
import { CreateNotificationDto, QueryNotificationsDto } from './dto/notification.dto';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(
        @InjectRepository(Notification)
        private readonly notificationRepo: Repository<Notification>,
    ) { }

    async create(dto: CreateNotificationDto): Promise<Notification> {
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

        const saved = await this.notificationRepo.save(notification);
        this.logger.log(`Notificación creada: ${saved.id} para usuario ${saved.usuarioId}`);
        return saved;
    }

    async findAll(query: QueryNotificationsDto): Promise<Notification[]> {
        const qb = this.notificationRepo.createQueryBuilder('n');

        if (query.usuarioId) {
            qb.where('n.usuario_id = :usuarioId', { usuarioId: query.usuarioId });
        }

        if (query.tipoId) {
            qb.andWhere('n.tipo_id = :tipoId', { tipoId: query.tipoId });
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

    async markAllAsRead(usuarioId: string): Promise<void> {
        await this.notificationRepo.update(
            { usuarioId, leida: false },
            { leida: true, leidaEn: new Date() },
        );
    }

    async deleteExpired(): Promise<number> {
        const result = await this.notificationRepo
            .createQueryBuilder()
            .delete()
            .where('expira_en IS NOT NULL AND expira_en < NOW()')
            .execute();

        if (result.affected && result.affected > 0) {
            this.logger.log(`Eliminadas ${result.affected} notificaciones expiradas`);
        }
        return result.affected ?? 0;
    }
}

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { TiposNotificacionService } from '../notifications/tipos-notificacion.service';
import { PrioridadNotificacion } from '../notifications/entities/notification.entity';

/**
 * Outbox entity from order-service (external DB).
 * Esta entidad se conecta a cafrilosa_pedidos.app.outbox_eventos.
 */
import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity({ schema: 'app', name: 'outbox_eventos' })
class OrderOutbox {
    @PrimaryColumn('uuid')
    id: string;

    @Column({ type: 'text' })
    agregado: string;

    @Column({ name: 'tipo_evento', type: 'text' })
    tipoEvento: string;

    @Column({ name: 'clave_agregado', type: 'text' })
    claveAgregado: string;

    @Column({ type: 'jsonb' })
    payload: Record<string, unknown>;

    @Column({ name: 'creado_en', type: 'timestamptz' })
    creadoEn: Date;

    @Column({ name: 'procesado_en', type: 'timestamptz', nullable: true })
    procesadoEn: Date | null;

    @Column({ type: 'int' })
    intentos: number;
}

/** Datos para crear una notificación desde un evento de outbox */
interface NotificationFromEvent {
    usuarioId: string;
    tipoCodigo: string;
    titulo: string;
    mensaje: string;
    payload: Record<string, unknown>;
    origenServicio: string;
    origenEventoId: string;
    prioridad: PrioridadNotificacion;
    requiereAccion: boolean;
    urlAccion?: string;
}

@Injectable()
export class OrderConsumerService {
    private readonly logger = new Logger(OrderConsumerService.name);

    constructor(
        @InjectRepository(OrderOutbox, 'orderConnection')
        private readonly outboxRepo: Repository<OrderOutbox>,
        private readonly notificationsService: NotificationsService,
        private readonly notificationsGateway: NotificationsGateway,
        private readonly tiposService: TiposNotificacionService,
    ) { }

    @Cron(CronExpression.EVERY_10_SECONDS)
    async processOrderEvents(): Promise<void> {
        const queryRunner = this.outboxRepo.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Lock y fetch de eventos no procesados con FOR UPDATE SKIP LOCKED
            const events: OrderOutbox[] = await queryRunner.query(
                `SELECT * FROM app.outbox_eventos 
                 WHERE procesado_en IS NULL 
                 ORDER BY creado_en ASC 
                 LIMIT 50
                 FOR UPDATE SKIP LOCKED`
            );

            if (!events || events.length === 0) {
                await queryRunner.commitTransaction();
                return;
            }

            this.logger.log(`Procesando ${events.length} eventos de pedidos`);

            for (const event of events) {
                try {
                    // Marcar como procesado PRIMERO para prevenir re-procesamiento
                    await queryRunner.query(
                        'UPDATE app.outbox_eventos SET procesado_en = NOW() WHERE id = $1',
                        [event.id]
                    );

                    // Manejar el evento (crear notificación)
                    await this.handleEvent(event);
                } catch (error) {
                    this.logger.error(`Error procesando evento ${event.id}:`, error);
                    await queryRunner.query(
                        'UPDATE app.outbox_eventos SET intentos = intentos + 1 WHERE id = $1',
                        [event.id]
                    );
                }
            }

            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error('Error en order consumer:', error);
        } finally {
            await queryRunner.release();
        }
    }

    private async handleEvent(event: OrderOutbox): Promise<void> {
        const { tipo_evento: tipoEvento, payload } = event as unknown as {
            tipo_evento: string;
            payload: Record<string, unknown>;
        };

        let notificationData: NotificationFromEvent | null = null;

        switch (tipoEvento) {
            case 'PedidoCreado':
                if (payload.origen === 'cliente') {
                    notificationData = {
                        usuarioId: (payload.vendedor_id ?? payload.creado_por_id) as string,
                        tipoCodigo: 'pedido_creado',
                        titulo: '📦 Nuevo Pedido',
                        mensaje: `Pedido #${payload.numero_pedido} creado por cliente`,
                        payload: {
                            pedido_id: payload.pedido_id,
                            numero_pedido: payload.numero_pedido,
                            cliente_id: payload.cliente_id,
                            total: payload.total,
                        },
                        origenServicio: 'order',
                        origenEventoId: event.id,
                        prioridad: PrioridadNotificacion.NORMAL,
                        requiereAccion: true,
                        urlAccion: `/pedidos/${payload.pedido_id}`,
                    };
                }
                break;

            case 'PedidoValidadoBodega':
                notificationData = {
                    usuarioId: payload.cliente_id as string,
                    tipoCodigo: 'pedido_aprobado',
                    titulo: '✅ Pedido Aprobado',
                    mensaje: `Tu pedido #${payload.numero_pedido} ha sido aprobado por bodega`,
                    payload: {
                        pedido_id: payload.pedido_id,
                        numero_pedido: payload.numero_pedido,
                    },
                    origenServicio: 'order',
                    origenEventoId: event.id,
                    prioridad: PrioridadNotificacion.ALTA,
                    requiereAccion: false,
                    urlAccion: `/pedidos/${payload.pedido_id}`,
                };
                break;

            case 'PedidoAjustadoBodega':
                notificationData = {
                    usuarioId: payload.cliente_id as string,
                    tipoCodigo: 'pedido_ajustado',
                    titulo: '⚠️ Pedido Ajustado',
                    mensaje: `Tu pedido #${payload.numero_pedido} requiere tu aprobación por cambios realizados`,
                    payload: {
                        pedido_id: payload.pedido_id,
                        numero_pedido: payload.numero_pedido,
                        validacion_id: payload.validacion_id,
                    },
                    origenServicio: 'order',
                    origenEventoId: event.id,
                    prioridad: PrioridadNotificacion.URGENTE,
                    requiereAccion: true,
                    urlAccion: `/pedidos/${payload.pedido_id}/validar`,
                };
                break;

            case 'PedidoRechazadoCliente':
            case 'PedidoCancelado':
                notificationData = {
                    usuarioId: payload.cliente_id as string,
                    tipoCodigo: 'pedido_cancelado',
                    titulo: '❌ Pedido Cancelado',
                    mensaje: `El pedido #${payload.numero_pedido} ha sido cancelado`,
                    payload: {
                        pedido_id: payload.pedido_id,
                        numero_pedido: payload.numero_pedido,
                        motivo: payload.motivo,
                    },
                    origenServicio: 'order',
                    origenEventoId: event.id,
                    prioridad: PrioridadNotificacion.NORMAL,
                    requiereAccion: false,
                };
                break;

            case 'PedidoAsignadoRuta':
                notificationData = {
                    usuarioId: payload.cliente_id as string,
                    tipoCodigo: 'pedido_asignado_ruta',
                    titulo: '🚚 Pedido en Preparación',
                    mensaje: `Tu pedido #${payload.numero_pedido} ha sido asignado a una ruta`,
                    payload: {
                        pedido_id: payload.pedido_id,
                        numero_pedido: payload.numero_pedido,
                        rutero_id: payload.rutero_id,
                    },
                    origenServicio: 'order',
                    origenEventoId: event.id,
                    prioridad: PrioridadNotificacion.NORMAL,
                    requiereAccion: false,
                };
                break;

            default:
                this.logger.debug(`Tipo de evento no manejado: ${tipoEvento}`);
        }

        if (notificationData) {
            await this.createNotificationFromEvent(notificationData);
        }
    }

    /**
     * Crea una notificación desde un evento, resolviendo el código de tipo a UUID.
     */
    private async createNotificationFromEvent(data: NotificationFromEvent): Promise<void> {
        const tipoId = await this.tiposService.getIdByCodigo(data.tipoCodigo);

        if (!tipoId) {
            this.logger.warn(`Tipo de notificación '${data.tipoCodigo}' no encontrado, creando...`);
            // Auto-crear el tipo si no existe (útil en desarrollo)
            const nuevoTipo = await this.tiposService.create({
                codigo: data.tipoCodigo,
                nombre: data.tipoCodigo.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            });
            await this.createAndSendNotification(data, nuevoTipo.id);
        } else {
            await this.createAndSendNotification(data, tipoId);
        }
    }

    private async createAndSendNotification(
        data: NotificationFromEvent,
        tipoId: string,
    ): Promise<void> {
        const notification = await this.notificationsService.create({
            usuarioId: data.usuarioId,
            tipoId,
            titulo: data.titulo,
            mensaje: data.mensaje,
            payload: data.payload,
            origenServicio: data.origenServicio,
            origenEventoId: data.origenEventoId,
            prioridad: data.prioridad,
            requiereAccion: data.requiereAccion,
            urlAccion: data.urlAccion,
        });

        // Enviar via WebSocket si el usuario está conectado
        if (this.notificationsGateway.isUserConnected(data.usuarioId)) {
            this.notificationsGateway.sendToUser(data.usuarioId, notification);
            this.logger.log(`Notificación en tiempo real enviada a usuario ${data.usuarioId}`);
        }
    }
}

export { OrderOutbox };

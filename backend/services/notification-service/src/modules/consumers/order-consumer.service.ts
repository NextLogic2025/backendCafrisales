import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

/**
 * Outbox entity from order-service (external DB)
 * Esta entidad se conecta a cafrilosa_pedidos.app.outbox_eventos
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
    payload: Record<string, any>;

    @Column({ name: 'creado_en', type: 'timestamptz' })
    creadoEn: Date;

    @Column({ name: 'procesado_en', type: 'timestamptz', nullable: true })
    procesadoEn: Date;

    @Column({ type: 'int' })
    intentos: number;
}

@Injectable()
export class OrderConsumerService {
    private readonly logger = new Logger(OrderConsumerService.name);

    constructor(
        @InjectRepository(OrderOutbox, 'orderConnection')
        private readonly outboxRepo: Repository<OrderOutbox>,
        private readonly notificationsService: NotificationsService,
        private readonly notificationsGateway: NotificationsGateway,
    ) { }

    @Cron(CronExpression.EVERY_10_SECONDS)
    async processOrderEvents() {
        const queryRunner = this.outboxRepo.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Lock and fetch unprocessed events using FOR UPDATE SKIP LOCKED
            const events = await queryRunner.query(
                `SELECT * FROM app.outbox_eventos 
                 WHERE procesado_en IS NULL 
                 ORDER BY creado_en ASC 
                 LIMIT 50
                 FOR UPDATE SKIP LOCKED`
            );

            if (events.length === 0) {
                await queryRunner.commitTransaction();
                return;
            }

            this.logger.log(`Processing ${events.length} order events`);

            for (const event of events) {
                try {
                    // Mark as processed FIRST to prevent re-processing
                    await queryRunner.query(
                        'UPDATE app.outbox_eventos SET procesado_en = NOW() WHERE id = $1',
                        [event.id]
                    );

                    // Then handle the event (create notification)
                    await this.handleEvent(event);
                } catch (error) {
                    this.logger.error(`Error processing event ${event.id}:`, error);
                    await queryRunner.query(
                        'UPDATE app.outbox_eventos SET intentos = intentos + 1 WHERE id = $1',
                        [event.id]
                    );
                }
            }

            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error('Error in order consumer:', error);
        } finally {
            await queryRunner.release();
        }
    }

    private async handleEvent(event: any) {
        const { tipo_evento: tipoEvento, payload } = event;

        let notificationData = null;

        switch (tipoEvento) {
            case 'PedidoCreado':
                // Notificar al vendedor/supervisor
                if (payload.origen === 'cliente') {
                    notificationData = {
                        usuarioId: payload.vendedor_id || payload.creado_por_id,
                        tipo: 'pedido_creado',
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
                        prioridad: 'normal',
                        requiereAccion: true,
                        urlAccion: `/pedidos/${payload.pedido_id}`,
                    };
                }
                break;

            case 'PedidoValidadoBodega':
                // Notificar al cliente
                notificationData = {
                    usuarioId: payload.cliente_id,
                    tipo: 'pedido_aprobado',
                    titulo: '✅ Pedido Aprobado',
                    mensaje: `Tu pedido #${payload.numero_pedido} ha sido aprobado por bodega`,
                    payload: {
                        pedido_id: payload.pedido_id,
                        numero_pedido: payload.numero_pedido,
                    },
                    origenServicio: 'order',
                    origenEventoId: event.id,
                    prioridad: 'alta',
                    requiereAccion: false,
                    urlAccion: `/pedidos/${payload.pedido_id}`,
                };
                break;

            case 'PedidoAjustadoBodega':
                // Notificar al cliente sobre ajustes
                notificationData = {
                    usuarioId: payload.cliente_id,
                    tipo: 'pedido_ajustado',
                    titulo: '⚠️ Pedido Ajustado',
                    mensaje: `Tu pedido #${payload.numero_pedido} requiere tu aprobación por cambios realizados`,
                    payload: {
                        pedido_id: payload.pedido_id,
                        numero_pedido: payload.numero_pedido,
                        validacion_id: payload.validacion_id,
                    },
                    origenServicio: 'order',
                    origenEventoId: event.id,
                    prioridad: 'urgente',
                    requiereAccion: true,
                    urlAccion: `/pedidos/${payload.pedido_id}/validar`,
                };
                break;

            case 'PedidoRechazadoCliente':
            case 'PedidoCancelado':
                notificationData = {
                    usuarioId: payload.cliente_id,
                    tipo: 'pedido_cancelado',
                    titulo: '❌ Pedido Cancelado',
                    mensaje: `El pedido #${payload.numero_pedido} ha sido cancelado`,
                    payload: {
                        pedido_id: payload.pedido_id,
                        numero_pedido: payload.numero_pedido,
                        motivo: payload.motivo,
                    },
                    origenServicio: 'order',
                    origenEventoId: event.id,
                    prioridad: 'normal',
                };
                break;

            case 'PedidoAsignadoRuta':
                notificationData = {
                    usuarioId: payload.cliente_id,
                    tipo: 'pedido_asignado_ruta',
                    titulo: '🚚 Pedido en Preparación',
                    mensaje: `Tu pedido #${payload.numero_pedido} ha sido asignado a una ruta`,
                    payload: {
                        pedido_id: payload.pedido_id,
                        numero_pedido: payload.numero_pedido,
                        rutero_id: payload.rutero_id,
                    },
                    origenServicio: 'order',
                    origenEventoId: event.id,
                    prioridad: 'normal',
                };
                break;

            default:
                this.logger.debug(`Unhandled event type: ${tipoEvento}`);
        }

        if (notificationData) {
            const notification = await this.notificationsService.create(notificationData);

            // Enviar via WebSocket si está conectado
            if (this.notificationsGateway.isUserConnected(notificationData.usuarioId)) {
                this.notificationsGateway.sendToUser(notificationData.usuarioId, notification);
                this.logger.log(`Real-time notification sent to user ${notificationData.usuarioId}`);
            }
        }
    }
}

export { OrderOutbox };

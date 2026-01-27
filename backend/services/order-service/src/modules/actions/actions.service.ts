import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { AccionClienteValidacion } from './entities/accion-cliente-validacion.entity';
import { CreateAccionDto } from './dto/create-accion.dto';
import { Pedido } from '../orders/entities/pedido.entity';
import { ValidacionBodega } from '../validations/entities/validacion-bodega.entity';
import { HistorialEstadoPedido } from '../history/entities/historial-estado-pedido.entity';
import { CancelacionPedido } from '../cancellations/entities/cancelacion-pedido.entity';
import { AccionClienteAjuste } from '../../common/constants/client-action.enum';
import { EstadoPedido } from '../../common/constants/order-status.enum';
import { OutboxService } from '../outbox/outbox.service';

@Injectable()
export class ActionsService {
    constructor(
        @InjectRepository(AccionClienteValidacion)
        private readonly accionRepo: Repository<AccionClienteValidacion>,
        private readonly dataSource: DataSource,
        private readonly outboxService: OutboxService,
    ) {}

    async respondToAdjustment(dto: CreateAccionDto, clienteId: string): Promise<AccionClienteValidacion> {
        if (dto.cliente_id !== clienteId) {
            throw new ForbiddenException('Solo el cliente puede responder por sí mismo');
        }

        return this.dataSource.transaction(async (manager) => {
            const pedido = await manager.findOne(Pedido, { where: { id: dto.pedido_id } });
            if (!pedido) {
                throw new NotFoundException(`Pedido ${dto.pedido_id} no encontrado`);
            }

            const validacion = await manager.findOne(ValidacionBodega, { where: { id: dto.validacion_id } });
            if (
                !validacion ||
                validacion.pedido_id !== pedido.id ||
                !validacion.requiere_aceptacion_cliente
            ) {
                throw new BadRequestException('Validación inválida para responder');
            }

            if (pedido.estado !== EstadoPedido.AJUSTADO_BODEGA) {
                throw new BadRequestException('El pedido no está en estado ajustado por bodega');
            }

            const existente = await manager.findOne(AccionClienteValidacion, {
                where: { pedido_id: pedido.id, validacion_id: validacion.id },
            });
            if (existente) {
                throw new BadRequestException('Ya existe una acción para esta validación');
            }

            const accion = manager.create(AccionClienteValidacion, {
                ...dto,
                pedido_id: pedido.id,
            });

            const savedAccion = await manager.save(AccionClienteValidacion, accion);

            if (dto.accion === AccionClienteAjuste.ACEPTA) {
                await this.acceptAdjustment(manager, pedido, validacion.id, clienteId);
            } else {
                await this.rejectAdjustment(manager, pedido, validacion.id, clienteId, dto.comentario);
            }

            return savedAccion;
        });
    }

    private async acceptAdjustment(
        manager: EntityManager,
        pedido: Pedido,
        validacionId: string,
        clienteId: string,
    ) {
        pedido.estado = EstadoPedido.ACEPTADO_CLIENTE;
        pedido.actualizado_por = clienteId;
        await manager.save(Pedido, pedido);

        await this.recordHistory(
            manager,
            pedido.id,
            EstadoPedido.ACEPTADO_CLIENTE,
            clienteId,
            'Cliente aceptó ajustes de validación',
        );

        await this.outboxService.createEvent(
            'PedidoAceptadoCliente',
            { pedido_id: pedido.id, validacion_id: validacionId },
            'order',
            pedido.id,
            manager,
        );
    }

    private async rejectAdjustment(
        manager: EntityManager,
        pedido: Pedido,
        validacionId: string,
        clienteId: string,
        comentario?: string,
    ) {
        pedido.estado = EstadoPedido.RECHAZADO_CLIENTE;
        pedido.actualizado_por = clienteId;
        await manager.save(Pedido, pedido);

        await this.recordHistory(
            manager,
            pedido.id,
            EstadoPedido.RECHAZADO_CLIENTE,
            clienteId,
            'Cliente rechazó ajustes de bodega',
        );

        const motivo = comentario?.trim() || 'Cliente rechazó ajustes de bodega';
        await this.createCancellationRecord(manager, pedido.id, clienteId, motivo);

        pedido.estado = EstadoPedido.CANCELADO;
        await manager.save(Pedido, pedido);

        await this.recordHistory(
            manager,
            pedido.id,
            EstadoPedido.CANCELADO,
            clienteId,
            'Pedido cancelado tras rechazo del cliente',
        );

        await this.outboxService.createEvent(
            'PedidoCancelado',
            { pedido_id: pedido.id, motivo, validacion_id: validacionId },
            'order',
            pedido.id,
            manager,
        );
    }

    private async createCancellationRecord(
        manager: EntityManager,
        pedidoId: string,
        clienteId: string,
        motivo: string,
    ) {
        const cancelacion = manager.create(CancelacionPedido, {
            pedido_id: pedidoId,
            cancelado_por_id: clienteId,
            motivo,
        });
        await manager.save(CancelacionPedido, cancelacion);
    }

    private async recordHistory(
        manager: EntityManager,
        pedidoId: string,
        estado: EstadoPedido,
        actorId: string,
        motivo: string,
    ) {
        const historial = manager.create(HistorialEstadoPedido, {
            pedido_id: pedidoId,
            estado,
            cambiado_por_id: actorId,
            motivo,
        });
        await manager.save(HistorialEstadoPedido, historial);
    }
}

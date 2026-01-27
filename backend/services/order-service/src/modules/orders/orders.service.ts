import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager, SelectQueryBuilder } from 'typeorm';
import { Pedido } from './entities/pedido.entity';
import { ItemPedido } from './entities/item-pedido.entity';
import { HistorialEstadoPedido } from '../history/entities/historial-estado-pedido.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { AddItemDto } from './dto/add-item.dto';
import { CatalogExternalService } from '../../services/catalog-external.service';
import { UserExternalService, ClienteCondiciones } from '../../services/user-external.service';
import { ZoneExternalService } from '../../services/zone-external.service';
import { CreditExternalService } from '../../services/credit-external.service';
import { OutboxService } from '../outbox/outbox.service';
import { CancelacionPedido } from '../cancellations/entities/cancelacion-pedido.entity';
import { RolUsuario } from '../../common/constants/rol-usuario.enum';
import { EstadoPedido } from '../../common/constants/order-status.enum';
import { OrigenCreacion } from '../../common/constants/creation-source.enum';
import { TipoDescuento } from '../../common/constants/discount-type.enum';
import { OrigenPrecio } from '../../common/constants/price-origin.enum';
import { MetodoPago } from '../../common/constants/payment-method.enum';
import type { CatalogSkuSnapshot } from '../../common/interfaces/catalog-sku-snapshot.interface';

const TAX_RATE = 0.12;
const DEFAULT_LIST_LIMIT = 100;

interface PreparedItem {
    sku_id: string;
    cantidad_solicitada: number;
    sku_nombre_snapshot: string;
    sku_codigo_snapshot: string;
    sku_peso_gramos_snapshot: number;
    sku_tipo_empaque_snapshot: string;
    precio_unitario_base: number;
    precio_unitario_final: number;
    subtotal: number;
    descuento_item_tipo?: TipoDescuento;
    descuento_item_valor?: number;
    precio_origen: OrigenPrecio;
    requiere_aprobacion: boolean;
}

@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(Pedido)
        private readonly pedidoRepo: Repository<Pedido>,
        private readonly dataSource: DataSource,
        private readonly catalogExternalService: CatalogExternalService,
        private readonly userExternalService: UserExternalService,
        private readonly zoneExternalService: ZoneExternalService,
        private readonly creditExternalService: CreditExternalService,
        private readonly outboxService: OutboxService,
    ) {}

    async create(dto: CreateOrderDto, user: { userId: string; role: RolUsuario }): Promise<Pedido> {
        const isCliente = user.role === RolUsuario.CLIENTE;
        const origen = isCliente ? OrigenCreacion.CLIENTE : OrigenCreacion.VENDEDOR;
        const clienteId = isCliente ? user.userId : dto.cliente_id;
        if (!clienteId) {
            throw new BadRequestException('Cliente es requerido para crear el pedido');
        }

        const cliente = await this.userExternalService.getClientById(clienteId);
        if (!cliente) {
            throw new NotFoundException(`Cliente ${clienteId} no encontrado`);
        }

        await this.ensureConditionValidation(dto, isCliente, clienteId);

        const zoneId = await this.resolveZoneId(dto.zona_id, cliente);

        const skuMap = await this.buildSkuSnapshotMap(dto.items);
        const items = this.buildItems(dto.items, skuMap);
        const totals = this.calculateTotals(items, dto);

        return this.dataSource.transaction(async (manager) => {
            const numeroPedido = await this.generateOrderNumber(manager);
            const pedido = manager.create(Pedido, {
                numero_pedido: numeroPedido,
                cliente_id: clienteId,
                zona_id: zoneId,
                creado_por_id: user.userId,
                creado_por: user.userId,
                actualizado_por: user.userId,
                origen,
                estado: EstadoPedido.PENDIENTE_VALIDACION,
                metodo_pago: dto.metodo_pago,
                notas: dto.notas,
                fecha_entrega_sugerida: dto.fecha_entrega_sugerida,
                ...totals,
            });

            const savedPedido = await manager.save(Pedido, pedido);

            const itemsEntity = items.map((item) =>
                manager.create(ItemPedido, {
                    ...item,
                    pedido_id: savedPedido.id,
                    creado_por: user.userId,
                }),
            );

            await manager.save(ItemPedido, itemsEntity);

            await this.recordHistory(
                manager,
                savedPedido.id,
                EstadoPedido.PENDIENTE_VALIDACION,
                user.userId,
                'Pedido creado y en cola de validación',
            );

            await this.outboxService.createEvent(
                'PedidoCreado',
                {
                    pedido_id: savedPedido.id,
                    cliente_id: savedPedido.cliente_id,
                    total: savedPedido.total,
                },
                'order',
                savedPedido.id,
                manager,
            );

            const fullPedido = await manager.findOne(Pedido, {
                where: { id: savedPedido.id },
                relations: ['items', 'validaciones', 'validaciones.items', 'historial'],
            });
            if (!fullPedido) {
                throw new NotFoundException(`Pedido ${savedPedido.id} no encontrado`);
            }
            return fullPedido;
        });
    }

    async findAll(): Promise<Pedido[]> {
        return this.pedidoRepo.find({
            relations: ['items', 'validaciones', 'validaciones.items', 'historial'],
            order: { creado_en: 'DESC' },
        });
    }

    async findByClient(clienteId: string, estado?: EstadoPedido): Promise<Pedido[]> {
        const where: any = { cliente_id: clienteId };
        if (estado) {
            where.estado = estado;
        }
        return this.pedidoRepo.find({
            where,
            relations: ['items'],
            order: { creado_en: 'DESC' },
        });
    }

    async findOne(id: string): Promise<Pedido> {
        const pedido = await this.pedidoRepo.findOne({
            where: { id },
            relations: ['items', 'validaciones', 'validaciones.items', 'historial'],
        });
        if (!pedido) {
            throw new NotFoundException(`Pedido ${id} no encontrado`);
        }
        return pedido;
    }

    async findPendingValidation(limit = DEFAULT_LIST_LIMIT): Promise<Pedido[]> {
        return this.pedidoRepo.find({
            where: { estado: EstadoPedido.PENDIENTE_VALIDACION },
            order: { creado_en: 'ASC' },
            take: limit,
            relations: ['items'],
        });
    }

    async findByZoneAndDate(
        zonaId: string,
        fechaEntrega: string,
        estados: EstadoPedido[] = [EstadoPedido.VALIDADO, EstadoPedido.ACEPTADO_CLIENTE],
        limit = DEFAULT_LIST_LIMIT,
    ): Promise<Pedido[]> {
        if (!zonaId || !fechaEntrega) {
            throw new BadRequestException('zona_id y fecha_entrega son obligatorios');
        }

        const query: SelectQueryBuilder<Pedido> = this.pedidoRepo
            .createQueryBuilder('pedido')
            .leftJoinAndSelect('pedido.items', 'items')
            .where('pedido.zona_id = :zonaId', { zonaId })
            .andWhere('pedido.fecha_entrega_sugerida = :fecha', { fecha: fechaEntrega })
            .andWhere('pedido.estado IN (:...estados)', { estados })
            .orderBy('pedido.creado_en', 'ASC')
            .take(limit);

        return query.getMany();
    }

    private async resolveZoneId(requestedZoneId: string, client: any): Promise<string> {
        const candidate =
            requestedZoneId ||
            client?.zona_id ||
            client?.zonaId ||
            client?.zone_id ||
            client?.zona ||
            null;

        if (!candidate) {
            throw new BadRequestException('Zona no disponible para el pedido');
        }

        const zone = await this.zoneExternalService.getZoneById(candidate);
        if (!zone) {
            throw new NotFoundException(`Zona ${candidate} no encontrada`);
        }

        return candidate;
    }

    private async buildSkuSnapshotMap(itemDtos: AddItemDto[]): Promise<Map<string, CatalogSkuSnapshot>> {
        const skuIds = [...new Set(itemDtos.map((item) => item.sku_id))];
        const snapshots = await this.catalogExternalService.getSkuSnapshots(skuIds);
        const map = new Map<string, CatalogSkuSnapshot>(snapshots.map((snapshot) => [snapshot.sku_id, snapshot]));

        const missing = skuIds.filter((skuId) => !map.has(skuId));
        if (missing.length) {
            throw new NotFoundException(`SKUs no encontrados: ${missing.join(', ')}`);
        }

        return map;
    }

    private buildItems(itemDtos: AddItemDto[], snapshotMap: Map<string, CatalogSkuSnapshot>): PreparedItem[] {
        return itemDtos.map((itemDto) => {
            const snapshot = snapshotMap.get(itemDto.sku_id);
            if (!snapshot) {
                throw new NotFoundException(`SKU ${itemDto.sku_id} no encontrado en catálogo`);
            }

            const precioBase = Number(snapshot.precio_unitario ?? 0);
            if (Number.isNaN(precioBase) || precioBase < 0) {
                throw new BadRequestException(`El SKU ${itemDto.sku_id} no tiene precio válido`);
            }

            const precioFinal = itemDto.precio_unitario_final ?? precioBase;
            const subtotal = Number((precioFinal * itemDto.cantidad).toFixed(2));

            const peso = Number(snapshot.peso_gramos ?? 0);
            if (Number.isNaN(peso) || peso <= 0) {
                throw new BadRequestException(`El SKU ${itemDto.sku_id} requiere peso válido`);
            }

            return {
                sku_id: itemDto.sku_id,
                cantidad_solicitada: itemDto.cantidad,
                sku_nombre_snapshot: snapshot.nombre ?? 'Sin nombre',
                sku_codigo_snapshot: snapshot.codigo ?? 'SIN-CODIGO',
                sku_peso_gramos_snapshot: Math.floor(peso),
                sku_tipo_empaque_snapshot: snapshot.tipo_empaque ?? 'desconocido',
                precio_unitario_base: precioBase,
                precio_unitario_final: Number(precioFinal.toFixed(2)),
                subtotal,
                descuento_item_tipo: itemDto.descuento_item_tipo,
                descuento_item_valor: itemDto.descuento_item_valor,
                precio_origen: itemDto.origen_precio,
                requiere_aprobacion: itemDto.requiere_aprobacion ?? false,
            };
        });
    }

    private calculateTotals(items: PreparedItem[], dto: CreateOrderDto) {
        const subtotal = Number(items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
        const descuento_pedido_tipo = dto.descuento_pedido_tipo ?? null;
        const descuentoValor =
            descuento_pedido_tipo && dto.descuento_pedido_valor != null
                ? this.calculateOrderDiscount(subtotal, descuento_pedido_tipo, dto.descuento_pedido_valor)
                : null;

        const base = Number((subtotal - (descuentoValor ?? 0)).toFixed(2));
        if (base < 0) {
            throw new BadRequestException('El descuento no puede ser mayor que el subtotal');
        }

        const impuesto = Number((base * TAX_RATE).toFixed(2));
        const total = Number((base + impuesto).toFixed(2));

        return {
            subtotal,
            impuesto,
            total,
            descuento_pedido_tipo,
            descuento_pedido_valor: descuentoValor,
        };
    }

    private calculateOrderDiscount(subtotal: number, tipo: TipoDescuento, valor: number): number {
        if (tipo === TipoDescuento.PORCENTAJE) {
            return Number(((subtotal * valor) / 100).toFixed(2));
        }
        return Number(valor.toFixed(2));
    }

    private ensureDiscountConsistency(dto: CreateOrderDto) {
        const hasTipo = Boolean(dto.descuento_pedido_tipo);
        const hasValor = dto.descuento_pedido_valor != null;
        if (hasTipo !== hasValor) {
            throw new BadRequestException('El tipo y el valor del descuento deben ir juntos');
        }

        if (dto.descuento_pedido_tipo === TipoDescuento.PORCENTAJE && dto.descuento_pedido_valor > 100) {
            throw new BadRequestException('El porcentaje de descuento no puede superar el 100%');
        }
    }

    private async ensureConditionValidation(dto: CreateOrderDto, isCliente: boolean, clienteId: string) {
        this.ensureDiscountConsistency(dto);

        if (isCliente && (dto.descuento_pedido_tipo || dto.descuento_pedido_valor != null)) {
            throw new BadRequestException('Los clientes no pueden negociar descuentos');
        }

        if (isCliente) {
            return;
        }

        const condiciones: ClienteCondiciones | null = await this.userExternalService.getClientConditions(clienteId);
        if (!condiciones) {
            return;
        }

        if (!condiciones.permite_negociacion && (dto.descuento_pedido_tipo || dto.descuento_pedido_valor != null)) {
            throw new BadRequestException('El cliente no permite negociaciones');
        }

        if (
            dto.descuento_pedido_tipo === TipoDescuento.PORCENTAJE &&
            typeof condiciones.max_descuento_porcentaje === 'number' &&
            dto.descuento_pedido_valor > condiciones.max_descuento_porcentaje
        ) {
            throw new ForbiddenException('El descuento supera el tope permitido por el cliente');
        }
    }

    private async generateOrderNumber(manager: EntityManager): Promise<string> {
        const year = new Date().getFullYear();
        const count = await manager.count(Pedido);
        const sequence = (count + 1).toString().padStart(4, '0');
        return `PED-${year}-${sequence}`;
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

    async updateStatus(id: string, estado: EstadoPedido, actor?: { userId: string }): Promise<Pedido> {
        const actorId = actor?.userId ?? 'system';
        return this.dataSource.transaction(async (manager) => {
            const pedido = await manager.findOne(Pedido, { where: { id } });
            if (!pedido) {
                throw new NotFoundException(`Pedido ${id} no encontrado`);
            }

            if ([EstadoPedido.ENTREGADO, EstadoPedido.CANCELADO].includes(pedido.estado)) {
                throw new BadRequestException('No se puede cambiar el estado de un pedido finalizado');
            }

            pedido.estado = estado;
            pedido.actualizado_por = actorId;
            await manager.save(Pedido, pedido);

            await this.recordHistory(manager, pedido.id, estado, actorId, `Estado actualizado manualmente`);

            await this.outboxService.createEvent(
                `Pedido${this.capitalizeEstado(estado)}`,
                { pedido_id: pedido.id, estado },
                'order',
                pedido.id,
                manager,
            );

            return this.findOne(pedido.id);
        });
    }

    async cancel(id: string, motivo: string, actorUserId: string): Promise<Pedido> {
        return this.dataSource.transaction(async (manager) => {
            const pedido = await manager.findOne(Pedido, { where: { id } });
            if (!pedido) {
                throw new NotFoundException(`Pedido ${id} no encontrado`);
            }

            if ([EstadoPedido.ENTREGADO, EstadoPedido.CANCELADO].includes(pedido.estado)) {
                throw new BadRequestException('No se puede cancelar un pedido finalizado');
            }

            pedido.estado = EstadoPedido.CANCELADO;
            pedido.actualizado_por = actorUserId;
            await manager.save(Pedido, pedido);

            await this.recordCancellation(
                manager,
                pedido.id,
                actorUserId,
                motivo || 'Cancelado manualmente',
            );

            await this.recordHistory(
                manager,
                pedido.id,
                EstadoPedido.CANCELADO,
                actorUserId,
                motivo || 'Cancelado manualmente',
            );

            await this.outboxService.createEvent(
                'PedidoCancelado',
                { pedido_id: pedido.id, motivo },
                'order',
                pedido.id,
                manager,
            );

            return this.findOne(pedido.id);
        });
    }

    async updatePaymentMethod(
        id: string,
        metodoPago: MetodoPago,
        actor: { userId: string; role: RolUsuario },
    ): Promise<Pedido> {
        if (!metodoPago) {
            throw new BadRequestException('Metodo de pago es obligatorio');
        }

        return this.dataSource.transaction(async (manager) => {
            const pedido = await manager.findOne(Pedido, { where: { id } });
            if (!pedido) {
                throw new NotFoundException(`Pedido ${id} no encontrado`);
            }

            if (pedido.estado !== EstadoPedido.PENDIENTE_VALIDACION) {
                throw new BadRequestException('Solo se puede cambiar el metodo de pago en pedidos pendientes');
            }

            const creditInfo = await this.creditExternalService.getCreditByOrder(pedido.id);
            const creditEstado = creditInfo?.credito?.estado;
            if (creditEstado && creditEstado !== 'cancelado') {
                throw new BadRequestException('No se puede cambiar el metodo de pago con un credito aprobado');
            }

            if (actor.role === RolUsuario.CLIENTE) {
                if (pedido.cliente_id !== actor.userId) {
                    throw new ForbiddenException('No tienes permisos para actualizar este pedido');
                }
            } else if (actor.role === RolUsuario.VENDEDOR) {
                if (pedido.creado_por_id !== actor.userId) {
                    throw new ForbiddenException('Solo puedes actualizar pedidos creados por ti');
                }
            } else {
                throw new ForbiddenException('No tienes permisos para actualizar este pedido');
            }

            pedido.metodo_pago = metodoPago;
            pedido.actualizado_por = actor.userId;
            await manager.save(Pedido, pedido);

            await this.recordHistory(
                manager,
                pedido.id,
                pedido.estado,
                actor.userId,
                `Metodo de pago actualizado a ${metodoPago}`,
            );

            await this.outboxService.createEvent(
                'PedidoMetodoPagoActualizado',
                { pedido_id: pedido.id, metodo_pago: metodoPago },
                'order',
                pedido.id,
                manager,
            );

            return this.findOne(pedido.id);
        });
    }

    async remove(id: string): Promise<void> {
        const pedido = await this.findOne(id);
        if (pedido.estado !== EstadoPedido.PENDIENTE_VALIDACION) {
            throw new BadRequestException('Solo se pueden eliminar pedidos pendientes de validación');
        }

        await this.pedidoRepo.remove(pedido);
    }

    private async recordCancellation(
        manager: EntityManager,
        pedidoId: string,
        actorId: string,
        motivo: string,
    ) {
        const cancelacion = manager.create(CancelacionPedido, {
            pedido_id: pedidoId,
            cancelado_por_id: actorId,
            motivo,
        });
        await manager.save(CancelacionPedido, cancelacion);
    }

    private capitalizeEstado(status: EstadoPedido): string {
        return status
            .split('_')
            .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
            .join('');
    }
}

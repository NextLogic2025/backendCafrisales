import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Pedido } from './entities/pedido.entity';
import { ItemPedido } from './entities/item-pedido.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { EstadoPedido } from '../../common/constants/order-status.enum';

@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(Pedido)
        private readonly pedidoRepo: Repository<Pedido>,
        @InjectRepository(ItemPedido)
        private readonly itemRepo: Repository<ItemPedido>,
        private readonly dataSource: DataSource,
    ) { }

    /**
     * Generate unique order number
     */
    private async generateOrderNumber(): Promise<string> {
        const year = new Date().getFullYear();
        const count = await this.pedidoRepo.count();
        const sequence = (count + 1).toString().padStart(4, '0');
        return `PED-${year}-${sequence}`;
    }

    /**
     * Calculate order totals
     */
    private calculateTotals(items: { cantidad: number; precio_unitario: number }[]) {
        const subtotal = items.reduce((sum, item) => sum + item.cantidad * item.precio_unitario, 0);
        const impuestos = subtotal * 0.12; // 12% IVA
        const total = subtotal + impuestos;

        return {
            subtotal: Number(subtotal.toFixed(2)),
            impuestos: Number(impuestos.toFixed(2)),
            total: Number(total.toFixed(2)),
        };
    }

    /**
     * Create a new order with items (transactional)
     */
    async create(dto: CreateOrderDto): Promise<Pedido> {
        return this.dataSource.transaction(async (manager) => {
            // Generate order number
            const numero_pedido = await this.generateOrderNumber();

            // Calculate totals
            const totals = this.calculateTotals(dto.items);

            // Create order
            const pedido = manager.create(Pedido, {
                numero_pedido,
                cliente_id: dto.cliente_id,
                vendedor_id: dto.vendedor_id,
                zona_id: dto.zona_id,
                estado: EstadoPedido.BORRADOR,
                notas: dto.notas,
                ...totals,
            });

            const savedPedido = await manager.save(Pedido, pedido);

            // Create items
            const items = dto.items.map((itemDto) => {
                const subtotal = itemDto.cantidad * itemDto.precio_unitario;
                return manager.create(ItemPedido, {
                    pedido_id: savedPedido.id,
                    sku_id: itemDto.sku_id,
                    cantidad: itemDto.cantidad,
                    precio_unitario: itemDto.precio_unitario,
                    origen_precio: itemDto.origen_precio,
                    subtotal: Number(subtotal.toFixed(2)),
                });
            });

            await manager.save(ItemPedido, items);

            // Return complete order with items
            return manager.findOne(Pedido, {
                where: { id: savedPedido.id },
                relations: ['items'],
            });
        });
    }

    /**
     * Find all orders
     */
    async findAll(): Promise<Pedido[]> {
        return this.pedidoRepo.find({
            relations: ['items'],
            order: { creado_en: 'DESC' },
        });
    }

    /**
     * Find orders by client
     */
    async findByClient(clienteId: string): Promise<Pedido[]> {
        return this.pedidoRepo.find({
            where: { cliente_id: clienteId },
            relations: ['items'],
            order: { creado_en: 'DESC' },
        });
    }

    /**
     * Find one order by ID
     */
    async findOne(id: string): Promise<Pedido> {
        const pedido = await this.pedidoRepo.findOne({
            where: { id },
            relations: ['items'],
        });

        if (!pedido) {
            throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
        }

        return pedido;
    }

    /**
     * Update order status
     */
    async updateStatus(id: string, estado: EstadoPedido): Promise<Pedido> {
        const pedido = await this.findOne(id);

        // Validate state transitions (basic example)
        if (pedido.estado === EstadoPedido.CONFIRMADO || pedido.estado === EstadoPedido.CANCELADO) {
            throw new BadRequestException('No se puede cambiar el estado de un pedido confirmado o cancelado');
        }

        pedido.estado = estado;
        await this.pedidoRepo.save(pedido);

        return this.findOne(id);
    }

    /**
     * Cancel order
     */
    async cancel(id: string): Promise<Pedido> {
        return this.updateStatus(id, EstadoPedido.CANCELADO);
    }

    /**
     * Delete order (only if in draft state)
     */
    async remove(id: string): Promise<void> {
        const pedido = await this.findOne(id);

        if (pedido.estado !== EstadoPedido.BORRADOR) {
            throw new BadRequestException('Solo se pueden eliminar pedidos en estado borrador');
        }

        await this.pedidoRepo.remove(pedido);
    }
}

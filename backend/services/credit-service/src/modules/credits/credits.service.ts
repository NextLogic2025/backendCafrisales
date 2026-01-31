import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { AprobacionCredito } from './entities/aprobacion-credito.entity';
import { EstadoCredito } from '../../common/constants/credit-status.enum';
import { OrigenCredito } from '../../common/constants/credit-origin.enum';
import { OrderExternalService } from '../../services/order-external.service';
import { OutboxService } from '../outbox/outbox.service';
import { HistoryService } from '../history/history.service';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { CreditFilterDto } from './dto/credit-filter.dto';
import { PaginatedResponse, createPaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import { AprobarCreditoDto } from './dto/aprobar-credito.dto';

@Injectable()
export class CreditsService {
    constructor(
        @InjectRepository(AprobacionCredito)
        private readonly creditRepo: Repository<AprobacionCredito>,
        private readonly dataSource: DataSource,
        private readonly orderExternalService: OrderExternalService,
        private readonly outboxService: OutboxService,
        private readonly historyService: HistoryService,
    ) { }

    private calculateDueDate(approvalDate: Date, termDays: number): Date {
        const dueDate = new Date(approvalDate);
        dueDate.setDate(dueDate.getDate() + termDays);
        return dueDate;
    }

    async approve(
        dto: AprobarCreditoDto,
        aprobadoPorId: string,
        origen: OrigenCredito = OrigenCredito.VENDEDOR,
        motivoHistorial = 'Credito aprobado',
        tipoEvento = 'CreditoAprobado',
    ): Promise<AprobacionCredito> {
        const pedido = await this.orderExternalService.getOrderById(dto.pedido_id);
        if (!pedido) {
            throw new NotFoundException(`Pedido ${dto.pedido_id} no encontrado`);
        }

        if (pedido?.metodo_pago && pedido.metodo_pago !== 'credito') {
            throw new BadRequestException('El pedido no tiene metodo de pago credito');
        }

        if (pedido?.cliente_id && pedido.cliente_id !== dto.cliente_id) {
            throw new BadRequestException('El cliente del pedido no coincide con la solicitud');
        }

        return this.dataSource.transaction(async (manager) => {
            const existing = await manager.getRepository(AprobacionCredito).findOne({
                where: { pedido_id: dto.pedido_id },
            });

            if (existing) {
                throw new ConflictException(`El pedido ${dto.pedido_id} ya tiene un credito aprobado`);
            }

            const fechaAprobacion = dto.fecha_aprobacion ? new Date(dto.fecha_aprobacion) : new Date();
            const fechaVencimiento = this.calculateDueDate(fechaAprobacion, dto.plazo_dias);

            const credit = manager.create(AprobacionCredito, {
                pedido_id: dto.pedido_id,
                cliente_id: dto.cliente_id,
                aprobado_por_vendedor_id: aprobadoPorId,
                origen,
                monto_aprobado: dto.monto_aprobado,
                moneda: dto.moneda || 'USD',
                plazo_dias: dto.plazo_dias,
                fecha_aprobacion: fechaAprobacion,
                fecha_vencimiento: fechaVencimiento,
                estado: EstadoCredito.ACTIVO,
                notas: dto.notas || null,
                creado_por: aprobadoPorId,
                actualizado_por: aprobadoPorId,
            });

            const saved = await manager.save(AprobacionCredito, credit);

            await this.historyService.recordState(
                saved.id,
                EstadoCredito.ACTIVO,
                aprobadoPorId,
                motivoHistorial,
                manager,
            );

            await this.outboxService.createEvent(
                tipoEvento,
                {
                    credito_id: saved.id,
                    pedido_id: saved.pedido_id,
                    cliente_id: saved.cliente_id,
                    monto_aprobado: saved.monto_aprobado,
                    fecha_vencimiento: saved.fecha_vencimiento,
                },
                'credit',
                saved.id,
                manager,
            );

            return saved;
        });
    }

    async findAllPaginated(
        pagination: PaginationQueryDto,
        filters: CreditFilterDto,
    ): Promise<PaginatedResponse<any>> {
        const conditions: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (filters.customerId) {
            conditions.push(`ac.cliente_id = $${paramIndex++}`);
            values.push(filters.customerId);
        }

        if (filters.sellerId) {
            conditions.push(`ac.aprobado_por_vendedor_id = $${paramIndex++}`);
            values.push(filters.sellerId);
        }

        if (filters.status) {
            conditions.push(`ac.estado = $${paramIndex++}`);
            values.push(filters.status);
        }

        if (filters.orderId) {
            conditions.push(`ac.pedido_id = $${paramIndex++}`);
            values.push(filters.orderId);
        }

        if (filters.minAmount !== undefined) {
            conditions.push(`ac.monto_aprobado >= $${paramIndex++}`);
            values.push(filters.minAmount);
        }

        if (filters.maxAmount !== undefined) {
            conditions.push(`ac.monto_aprobado <= $${paramIndex++}`);
            values.push(filters.maxAmount);
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        // Sorting
        const sortField = ['monto_aprobado', 'fecha_aprobacion', 'fecha_vencimiento'].includes(pagination.sortBy)
            ? `ac.${pagination.sortBy}`
            : 'ac.creado_en';
        const sortOrder = pagination.sortOrder;

        // Count Query
        const countQuery = `
            SELECT COUNT(*) 
            FROM app.aprobaciones_credito ac 
            ${whereClause}
        `;
        const countResult = await this.creditRepo.query(countQuery, values);
        const total = parseInt(countResult[0].count, 10);

        // Data Query
        const dataQuery = `
            SELECT ac.*, vct.total_pagado, vct.saldo
            FROM app.aprobaciones_credito ac
            JOIN app.v_credito_totales vct
              ON vct.aprobacion_credito_id = ac.id
            ${whereClause}
            ORDER BY ${sortField} ${sortOrder}
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;

        values.push(pagination.take, pagination.skip);
        const data = await this.creditRepo.query(dataQuery, values);

        return createPaginatedResponse(data, total, pagination.page, pagination.limit);
    }

    async findAll(): Promise<any[]> {
        return this.fetchCreditsWithTotals();
    }

    async findByClient(clienteId: string, estado?: EstadoCredito): Promise<any[]> {
        return this.fetchCreditsWithTotals({
            cliente_id: clienteId,
            estado,
        });
    }

    async findByClientStates(clienteId: string, estados?: EstadoCredito[]): Promise<any[]> {
        return this.fetchCreditsWithTotals({
            cliente_id: clienteId,
            estados,
        });
    }

    async findBySeller(vendedorId: string, estados?: EstadoCredito[]): Promise<any[]> {
        return this.fetchCreditsWithTotals({
            aprobado_por_vendedor_id: vendedorId,
            estados,
            orderByVencimiento: true,
        });
    }

    async findOne(id: string): Promise<AprobacionCredito> {
        const credit = await this.creditRepo.findOne({
            where: { id },
            relations: ['pagos'],
        });

        if (!credit) {
            throw new NotFoundException(`Credito con ID ${id} no encontrado`);
        }

        return credit;
    }

    async findByOrder(pedidoId: string): Promise<AprobacionCredito> {
        const credit = await this.creditRepo.findOne({
            where: { pedido_id: pedidoId },
            relations: ['pagos'],
        });

        if (!credit) {
            throw new NotFoundException(`No se encontro credito para el pedido ${pedidoId}`);
        }

        return credit;
    }

    async updateStatus(
        id: string,
        estado: EstadoCredito,
        actorId: string,
        motivo?: string,
        manager?: EntityManager,
    ): Promise<AprobacionCredito> {
        const repo = manager ? manager.getRepository(AprobacionCredito) : this.creditRepo;
        const credit = await repo.findOne({ where: { id } });

        if (!credit) {
            throw new NotFoundException(`Credito con ID ${id} no encontrado`);
        }

        if (credit.estado === EstadoCredito.PAGADO || credit.estado === EstadoCredito.CANCELADO) {
            throw new BadRequestException('No se puede cambiar el estado de un credito pagado o cancelado');
        }

        credit.estado = estado;
        credit.actualizado_por = actorId;
        await repo.save(credit);

        await this.historyService.recordState(credit.id, estado, actorId, motivo || 'Actualizacion de estado', manager);

        const eventType =
            estado === EstadoCredito.CANCELADO
                ? 'CreditoCancelado'
                : estado === EstadoCredito.VENCIDO
                    ? 'CreditoVencido'
                    : 'CreditoEstadoActualizado';

        await this.outboxService.createEvent(
            eventType,
            { credito_id: credit.id, estado, motivo: motivo || null },
            'credit',
            credit.id,
            manager,
        );

        return credit;
    }

    async cancel(id: string, actorId: string, motivo?: string): Promise<AprobacionCredito> {
        return this.dataSource.transaction((manager) =>
            this.updateStatus(id, EstadoCredito.CANCELADO, actorId, motivo || 'Credito cancelado', manager),
        );
    }

    async markAsOverdue(id: string, actorId: string, manager?: EntityManager): Promise<AprobacionCredito> {
        return this.updateStatus(id, EstadoCredito.VENCIDO, actorId, 'Credito vencido', manager);
    }

    async markAsPaid(id: string, actorId: string, manager?: EntityManager): Promise<AprobacionCredito> {
        const repo = manager ? manager.getRepository(AprobacionCredito) : this.creditRepo;
        const credit = await repo.findOne({ where: { id } });
        if (!credit) {
            throw new NotFoundException(`Credito con ID ${id} no encontrado`);
        }

        credit.estado = EstadoCredito.PAGADO;
        credit.actualizado_por = actorId;
        await repo.save(credit);

        await this.historyService.recordState(
            credit.id,
            EstadoCredito.PAGADO,
            actorId,
            'Credito pagado completamente',
            manager,
        );

        return credit;
    }

    async getCreditDetail(id: string) {
        const credit = await this.findOne(id);
        const totals = await this.fetchTotalsByCreditId(id);
        return {
            credito: credit,
            totales: totals,
            pagos: credit.pagos || [],
        };
    }

    async getCreditDetailByOrder(pedidoId: string) {
        const credit = await this.findByOrder(pedidoId);
        const totals = await this.fetchTotalsByCreditId(credit.id);
        return {
            credito: credit,
            totales: totals,
            pagos: credit.pagos || [],
        };
    }

    async getCreditByOrderInternal(pedidoId: string) {
        const credit = await this.creditRepo.findOne({
            where: { pedido_id: pedidoId },
        });
        if (!credit) {
            return null;
        }
        const totals = await this.fetchTotalsByCreditId(credit.id);
        return {
            credito: credit,
            totales: totals,
            pagos: [],
        };
    }

    async processOverdues(actorId: string) {
        const today = new Date();
        return this.dataSource.transaction(async (manager) => {
            const repo = manager.getRepository(AprobacionCredito);
            const credits = await repo.find({
                where: { estado: EstadoCredito.ACTIVO } as any,
            });

            let processed = 0;
            for (const credit of credits) {
                if (credit.fecha_vencimiento && credit.fecha_vencimiento < today) {
                    await this.markAsOverdue(credit.id, actorId, manager);
                    processed += 1;
                }
            }

            return { procesados: processed };
        });
    }

    async listUpcomingDue(days: number) {
        const dias = Number.isNaN(days) ? 7 : days;
        const query = `
            SELECT ac.*, vct.total_pagado, vct.saldo,
                DATE_PART('day', ac.fecha_vencimiento - CURRENT_DATE) AS dias_restantes
            FROM app.aprobaciones_credito ac
            JOIN app.v_credito_totales vct
                ON vct.aprobacion_credito_id = ac.id
            WHERE ac.estado = 'activo'
              AND ac.fecha_vencimiento BETWEEN CURRENT_DATE AND CURRENT_DATE + ($1 || ' days')::interval
              AND vct.saldo > 0
            ORDER BY ac.fecha_vencimiento ASC
        `;
        return this.creditRepo.query(query, [dias]);
    }

    async listOverdueReport() {
        const query = `
            SELECT ac.*, vct.saldo,
                DATE_PART('day', CURRENT_DATE - ac.fecha_vencimiento) AS dias_vencido
            FROM app.aprobaciones_credito ac
            JOIN app.v_credito_totales vct
                ON vct.aprobacion_credito_id = ac.id
            WHERE ac.estado = 'vencido'
              AND vct.saldo > 0
            ORDER BY ac.fecha_vencimiento ASC
        `;
        return this.creditRepo.query(query);
    }

    async listPayments(id: string) {
        const credit = await this.findOne(id);
        return credit.pagos || [];
    }

    async getTotals(id: string) {
        return this.fetchTotalsByCreditId(id);
    }

    private async fetchCreditsWithTotals(params: {
        cliente_id?: string;
        aprobado_por_vendedor_id?: string;
        estado?: EstadoCredito;
        estados?: EstadoCredito[];
        orderByVencimiento?: boolean;
    } = {}) {
        const conditions: string[] = [];
        const values: any[] = [];

        if (params.cliente_id) {
            values.push(params.cliente_id);
            conditions.push(`ac.cliente_id = $${values.length}`);
        }

        if (params.aprobado_por_vendedor_id) {
            values.push(params.aprobado_por_vendedor_id);
            conditions.push(`ac.aprobado_por_vendedor_id = $${values.length}`);
        }

        if (params.estado) {
            values.push(params.estado);
            conditions.push(`ac.estado = $${values.length}`);
        }

        if (params.estados && params.estados.length) {
            values.push(params.estados);
            conditions.push(`ac.estado = ANY($${values.length})`);
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const orderBy = params.orderByVencimiento ? 'ac.fecha_vencimiento ASC' : 'ac.creado_en DESC';

        const query = `
            SELECT ac.*, vct.total_pagado, vct.saldo
            FROM app.aprobaciones_credito ac
            JOIN app.v_credito_totales vct
              ON vct.aprobacion_credito_id = ac.id
            ${whereClause}
            ORDER BY ${orderBy}
        `;

        return this.creditRepo.query(query, values);
    }

    private async fetchTotalsByCreditId(aprobacionCreditoId: string) {
        const query = `
            SELECT *
            FROM app.v_credito_totales
            WHERE aprobacion_credito_id = $1
        `;
        const rows = await this.creditRepo.query(query, [aprobacionCreditoId]);
        return rows[0] || null;
    }
}

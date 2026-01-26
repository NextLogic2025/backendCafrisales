import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { AprobacionCredito } from './entities/aprobacion-credito.entity';
import { CreateCreditDto } from './dto/create-credit.dto';
import { EstadoCredito } from '../../common/constants/credit-status.enum';

@Injectable()
export class CreditsService {
    constructor(
        @InjectRepository(AprobacionCredito)
        private readonly creditRepo: Repository<AprobacionCredito>,
        private readonly dataSource: DataSource,
    ) { }

    /**
     * Calculate due date based on approval date and term
     */
    private calculateDueDate(approvalDate: Date, termDays: number): Date {
        const dueDate = new Date(approvalDate);
        dueDate.setDate(dueDate.getDate() + termDays);
        return dueDate;
    }

    /**
     * Create a new credit approval
     */
    async create(dto: CreateCreditDto): Promise<AprobacionCredito> {
        // Check if order already has a credit
        const existing = await this.creditRepo.findOne({
            where: { pedido_id: dto.pedido_id },
        });

        if (existing) {
            throw new ConflictException(`El pedido ${dto.pedido_id} ya tiene un crédito aprobado`);
        }

        const fechaAprobacion = dto.fecha_aprobacion ? new Date(dto.fecha_aprobacion) : new Date();
        const fechaVencimiento = this.calculateDueDate(fechaAprobacion, dto.plazo_dias);

        const credit = this.creditRepo.create({
            ...dto,
            fecha_aprobacion: fechaAprobacion,
            fecha_vencimiento: fechaVencimiento,
            estado: EstadoCredito.ACTIVO,
        });

        return this.creditRepo.save(credit);
    }

    /**
     * Find all credits
     */
    async findAll(): Promise<AprobacionCredito[]> {
        return this.creditRepo.find({
            relations: ['pagos'],
            order: { creado_en: 'DESC' },
        });
    }

    /**
     * Find credits by client
     */
    async findByClient(clienteId: string): Promise<AprobacionCredito[]> {
        return this.creditRepo.find({
            where: { cliente_id: clienteId },
            relations: ['pagos'],
            order: { creado_en: 'DESC' },
        });
    }

    /**
     * Find credits by seller
     */
    async findBySeller(vendedorId: string): Promise<AprobacionCredito[]> {
        return this.creditRepo.find({
            where: { aprobado_por_vendedor_id: vendedorId },
            relations: ['pagos'],
            order: { creado_en: 'DESC' },
        });
    }

    /**
     * Find one credit
     */
    async findOne(id: string): Promise<AprobacionCredito> {
        const credit = await this.creditRepo.findOne({
            where: { id },
            relations: ['pagos'],
        });

        if (!credit) {
            throw new NotFoundException(`Crédito con ID ${id} no encontrado`);
        }

        return credit;
    }

    /**
     * Find credit by order
     */
    async findByOrder(pedidoId: string): Promise<AprobacionCredito> {
        const credit = await this.creditRepo.findOne({
            where: { pedido_id: pedidoId },
            relations: ['pagos'],
        });

        if (!credit) {
            throw new NotFoundException(`No se encontró crédito para el pedido ${pedidoId}`);
        }

        return credit;
    }

    /**
     * Update credit status
     */
    async updateStatus(id: string, estado: EstadoCredito): Promise<AprobacionCredito> {
        const credit = await this.findOne(id);

        // Validate state transitions
        if (credit.estado === EstadoCredito.PAGADO || credit.estado === EstadoCredito.CANCELADO) {
            throw new BadRequestException('No se puede cambiar el estado de un crédito pagado o cancelado');
        }

        credit.estado = estado;
        await this.creditRepo.save(credit);

        return this.findOne(id);
    }

    /**
     * Cancel credit
     */
    async cancel(id: string): Promise<AprobacionCredito> {
        return this.updateStatus(id, EstadoCredito.CANCELADO);
    }

    /**
     * Mark credit as overdue
     */
    async markAsOverdue(id: string): Promise<AprobacionCredito> {
        return this.updateStatus(id, EstadoCredito.VENCIDO);
    }

    /**
     * Mark credit as paid
     */
    async markAsPaid(id: string): Promise<AprobacionCredito> {
        return this.updateStatus(id, EstadoCredito.PAGADO);
    }
}

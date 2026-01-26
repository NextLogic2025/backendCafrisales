import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PagoCredito } from './entities/pago-credito.entity';
import { RegisterPaymentDto } from './dto/register-payment.dto';
import { CreditsService } from '../credits/credits.service';
import { EstadoCredito } from '../../common/constants/credit-status.enum';

@Injectable()
export class PaymentsService {
    constructor(
        @InjectRepository(PagoCredito)
        private readonly pagoRepo: Repository<PagoCredito>,
        private readonly creditsService: CreditsService,
        private readonly dataSource: DataSource,
    ) { }

    /**
     * Calculate balance for a credit
     */
    async calculateBalance(aprobacionCreditoId: string): Promise<{ total_pagado: number; saldo: number }> {
        const credit = await this.creditsService.findOne(aprobacionCreditoId);

        const pagos = await this.pagoRepo.find({
            where: { aprobacion_credito_id: aprobacionCreditoId },
        });

        const total_pagado = pagos.reduce((sum, pago) => sum + Number(pago.monto_pago), 0);
        const saldo = Number(credit.monto_aprobado) - total_pagado;

        return {
            total_pagado: Number(total_pagado.toFixed(2)),
            saldo: Number(saldo.toFixed(2)),
        };
    }

    /**
     * Register a new payment (transactional)
     */
    async registerPayment(dto: RegisterPaymentDto): Promise<PagoCredito> {
        return this.dataSource.transaction(async (manager) => {
            // Verify credit exists and is active
            const credit = await this.creditsService.findOne(dto.aprobacion_credito_id);

            if (credit.estado === EstadoCredito.CANCELADO) {
                throw new BadRequestException('No se pueden registrar pagos en un crédito cancelado');
            }

            // Calculate current balance
            const balance = await this.calculateBalance(dto.aprobacion_credito_id);

            // Validate payment amount doesn't exceed balance
            if (dto.monto_pago > balance.saldo) {
                throw new BadRequestException(
                    `El monto del pago (${dto.monto_pago}) excede el saldo pendiente (${balance.saldo})`,
                );
            }

            // Create payment
            const fechaPago = dto.fecha_pago ? new Date(dto.fecha_pago) : new Date();

            const pago = manager.create(PagoCredito, {
                ...dto,
                fecha_pago: fechaPago,
            });

            const savedPago = await manager.save(PagoCredito, pago);

            // Check if credit is fully paid
            const newBalance = balance.saldo - dto.monto_pago;
            if (newBalance <= 0.01) {
                // Mark as paid (tolerance of 1 cent)
                await this.creditsService.markAsPaid(dto.aprobacion_credito_id);
            }

            return savedPago;
        });
    }

    /**
     * Find payments by credit
     */
    async findByCredit(aprobacionCreditoId: string): Promise<PagoCredito[]> {
        return this.pagoRepo.find({
            where: { aprobacion_credito_id: aprobacionCreditoId },
            order: { fecha_pago: 'DESC' },
        });
    }

    /**
     * Find one payment
     */
    async findOne(id: string): Promise<PagoCredito> {
        const pago = await this.pagoRepo.findOne({
            where: { id },
            relations: ['aprobacion'],
        });

        if (!pago) {
            throw new NotFoundException(`Pago con ID ${id} no encontrado`);
        }

        return pago;
    }
}

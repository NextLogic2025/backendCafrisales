import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { PagoCredito } from './entities/pago-credito.entity';
import { RegisterPaymentDto } from './dto/register-payment.dto';
import { CreditsService } from '../credits/credits.service';
import { EstadoCredito } from '../../common/constants/credit-status.enum';
import { OutboxService } from '../outbox/outbox.service';
import { AprobacionCredito } from '../credits/entities/aprobacion-credito.entity';

@Injectable()
export class PaymentsService {
    constructor(
        @InjectRepository(PagoCredito)
        private readonly pagoRepo: Repository<PagoCredito>,
        private readonly creditsService: CreditsService,
        private readonly dataSource: DataSource,
        private readonly outboxService: OutboxService,
    ) {}

    async calculateBalance(aprobacionCreditoId: string): Promise<{ total_pagado: number; saldo: number }> {
        const totals = await this.fetchTotalsByCreditId(aprobacionCreditoId);
        if (!totals) {
            throw new NotFoundException(`Credito ${aprobacionCreditoId} no encontrado`);
        }

        return {
            total_pagado: Number(totals.total_pagado),
            saldo: Number(totals.saldo),
        };
    }

    async registerPayment(dto: RegisterPaymentDto, actorId?: string): Promise<PagoCredito> {
        return this.dataSource.transaction(async (manager) => {
            const credit = await manager.getRepository(AprobacionCredito).findOne({
                where: { id: dto.aprobacion_credito_id },
            } as any);

            if (!credit) {
                throw new NotFoundException(`Credito ${dto.aprobacion_credito_id} no encontrado`);
            }

            if (credit.estado === EstadoCredito.CANCELADO) {
                throw new BadRequestException('No se pueden registrar pagos en un credito cancelado');
            }

            if (credit.estado === EstadoCredito.PAGADO) {
                throw new BadRequestException('El credito ya esta pagado');
            }

            const balance = await this.fetchTotalsByCreditId(dto.aprobacion_credito_id, manager);
            if (!balance) {
                throw new NotFoundException(`Totales no disponibles para el credito ${dto.aprobacion_credito_id}`);
            }

            const saldoActual = Number(balance.saldo);
            if (dto.monto_pago > saldoActual) {
                throw new BadRequestException(
                    `El monto del pago (${dto.monto_pago}) excede el saldo pendiente (${saldoActual})`,
                );
            }

            const fechaPago = dto.fecha_pago ? new Date(dto.fecha_pago) : new Date();
            const registradoPor = dto.registrado_por_id || actorId;
            if (!registradoPor) {
                throw new BadRequestException('registrado_por_id es requerido');
            }

            const pago = manager.create(PagoCredito, {
                ...dto,
                registrado_por_id: registradoPor,
                fecha_pago: fechaPago,
            });

            const savedPago = await manager.save(PagoCredito, pago);

            const saldoRestante = Number((saldoActual - dto.monto_pago).toFixed(2));

            if (saldoRestante <= 0) {
                await this.creditsService.markAsPaid(dto.aprobacion_credito_id, registradoPor, manager);
                await this.outboxService.createEvent(
                    'PagoCreditoRegistrado',
                    { credito_id: dto.aprobacion_credito_id, pago_id: savedPago.id, saldo_restante: 0 },
                    'credit',
                    dto.aprobacion_credito_id,
                    manager,
                );
            } else {
                await this.outboxService.createEvent(
                    'PagoParcialRegistrado',
                    { credito_id: dto.aprobacion_credito_id, pago_id: savedPago.id, saldo_restante: saldoRestante },
                    'credit',
                    dto.aprobacion_credito_id,
                    manager,
                );
            }

            return savedPago;
        });
    }

    async findByCredit(aprobacionCreditoId: string): Promise<PagoCredito[]> {
        return this.pagoRepo.find({
            where: { aprobacion_credito_id: aprobacionCreditoId },
            order: { fecha_pago: 'DESC' },
        });
    }

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

    private async fetchTotalsByCreditId(aprobacionCreditoId: string, manager?: EntityManager) {
        const repo = manager ? manager.getRepository(PagoCredito) : this.pagoRepo;
        const query = `
            SELECT *
            FROM app.v_credito_totales
            WHERE aprobacion_credito_id = $1
        `;
        const rows = await repo.query(query, [aprobacionCreditoId]);
        return rows[0] || null;
    }
}

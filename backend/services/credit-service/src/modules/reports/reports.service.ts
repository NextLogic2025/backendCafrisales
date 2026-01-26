import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AprobacionCredito } from '../credits/entities/aprobacion-credito.entity';
import { PagoCredito } from '../payments/entities/pago-credito.entity';
import { EstadoCredito } from '../../common/constants/credit-status.enum';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(AprobacionCredito)
    private readonly creditRepo: Repository<AprobacionCredito>,
    @InjectRepository(PagoCredito)
    private readonly pagoRepo: Repository<PagoCredito>,
  ) { }

  /**
   * Get portfolio summary (cartera)
   */
  async getPortfolioSummary() {
    const query = `
      SELECT
        ac.id AS aprobacion_credito_id,
        ac.pedido_id,
        ac.cliente_id,
        ac.monto_aprobado,
        ac.moneda,
        ac.estado,
        ac.fecha_vencimiento,
        COALESCE(SUM(pc.monto_pago), 0)::numeric(12,2) AS total_pagado,
        (ac.monto_aprobado - COALESCE(SUM(pc.monto_pago), 0))::numeric(12,2) AS saldo
      FROM app.aprobaciones_credito ac
      LEFT JOIN app.pagos_credito pc
        ON pc.aprobacion_credito_id = ac.id
      GROUP BY ac.id
      ORDER BY ac.creado_en DESC
    `;

    return this.creditRepo.query(query);
  }

  /**
   * Get active credits summary
   */
  async getActiveCredits() {
    const credits = await this.creditRepo.find({
      where: { estado: EstadoCredito.ACTIVO },
      relations: ['pagos'],
    });

    return credits.map((credit) => {
      const total_pagado = credit.pagos.reduce((sum, pago) => sum + Number(pago.monto_pago), 0);
      const saldo = Number(credit.monto_aprobado) - total_pagado;

      return {
        id: credit.id,
        pedido_id: credit.pedido_id,
        cliente_id: credit.cliente_id,
        monto_aprobado: credit.monto_aprobado,
        total_pagado: Number(total_pagado.toFixed(2)),
        saldo: Number(saldo.toFixed(2)),
        fecha_vencimiento: credit.fecha_vencimiento,
      };
    });
  }

  /**
   * Get overdue credits
   */
  async getOverdueCredits() {
    const today = new Date();

    const credits = await this.creditRepo
      .createQueryBuilder('credit')
      .where('credit.estado = :estado', { estado: EstadoCredito.ACTIVO })
      .andWhere('credit.fecha_vencimiento < :today', { today })
      .leftJoinAndSelect('credit.pagos', 'pagos')
      .getMany();

    return credits.map((credit) => {
      const total_pagado = credit.pagos.reduce((sum, pago) => sum + Number(pago.monto_pago), 0);
      const saldo = Number(credit.monto_aprobado) - total_pagado;

      return {
        id: credit.id,
        pedido_id: credit.pedido_id,
        cliente_id: credit.cliente_id,
        monto_aprobado: credit.monto_aprobado,
        total_pagado: Number(total_pagado.toFixed(2)),
        saldo: Number(saldo.toFixed(2)),
        fecha_vencimiento: credit.fecha_vencimiento,
        dias_vencido: Math.floor((today.getTime() - credit.fecha_vencimiento.getTime()) / (1000 * 60 * 60 * 24)),
      };
    });
  }
}

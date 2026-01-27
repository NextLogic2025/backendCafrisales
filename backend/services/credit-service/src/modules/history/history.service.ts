import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { HistorialEstadoCredito } from './entities/historial-estado-credito.entity';
import { EstadoCredito } from '../../common/constants/credit-status.enum';

@Injectable()
export class HistoryService {
    constructor(
        @InjectRepository(HistorialEstadoCredito)
        private readonly historyRepo: Repository<HistorialEstadoCredito>,
    ) {}

    async recordState(
        aprobacionCreditoId: string,
        estado: EstadoCredito,
        cambiadoPorId: string,
        motivo?: string,
        manager?: EntityManager,
    ) {
        const repo = manager ? manager.getRepository(HistorialEstadoCredito) : this.historyRepo;
        const entity = repo.create({
            aprobacion_credito_id: aprobacionCreditoId,
            estado,
            cambiado_por_id: cambiadoPorId,
            motivo: motivo || null,
        } as any);
        return repo.save(entity);
    }

    async listByCredit(aprobacionCreditoId: string) {
        return this.historyRepo.find({
            where: { aprobacion_credito_id: aprobacionCreditoId } as any,
            order: { creado_en: 'DESC' },
        });
    }
}

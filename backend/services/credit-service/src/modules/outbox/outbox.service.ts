import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Outbox } from './entities/outbox.entity';

@Injectable()
export class OutboxService {
    constructor(
        @InjectRepository(Outbox)
        private readonly outboxRepo: Repository<Outbox>,
    ) { }

    /**
     * Create an outbox event
     */
    async createEvent(
        tipoEvento: string,
        payload: any,
        agregado: string = 'credit',
        claveAgregado?: string,
        manager?: EntityManager,
    ): Promise<Outbox> {
        const repo = manager ? manager.getRepository(Outbox) : this.outboxRepo;
        const event = repo.create({
            tipo_evento: tipoEvento,
            payload,
            agregado,
            clave_agregado: claveAgregado,
        });

        return repo.save(event);
    }

    /**
     * Mark event as processed
     */
    async markAsProcessed(id: string): Promise<void> {
        await this.outboxRepo.update(id, {
            procesado_en: new Date(),
        });
    }

    /**
     * Get pending events
     */
    async getPendingEvents(): Promise<Outbox[]> {
        return this.outboxRepo.find({
            where: { procesado_en: null as any },
            order: { creado_en: 'ASC' },
            take: 100,
        });
    }
}

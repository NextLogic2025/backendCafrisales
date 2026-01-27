import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Outbox } from './entities/outbox.entity';

@Injectable()
export class OutboxService {
    constructor(
        @InjectRepository(Outbox)
        private readonly outboxRepo: Repository<Outbox>,
    ) { }

    async createEvent(
        tipoEvento: string,
        payload: any,
        agregado: string = 'delivery',
        claveAgregado?: string,
        manager?: EntityManager,
    ): Promise<Outbox> {
        const repo = manager ? manager.getRepository(Outbox) : this.outboxRepo;
        const event = repo.create({
            tipo_evento: tipoEvento,
            payload,
            agregado,
            clave_agregado: claveAgregado || '',
        });

        return repo.save(event);
    }
}

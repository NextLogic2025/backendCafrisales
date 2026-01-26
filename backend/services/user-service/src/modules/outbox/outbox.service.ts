import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Outbox } from './entities/outbox.entity';

@Injectable()
export class OutboxService {
  constructor(
    @InjectRepository(Outbox)
    private readonly outboxRepo: Repository<Outbox>,
  ) {}

  async createEvent(params: {
    tipo: string;
    claveAgregado: string;
    payload: any;
    agregado?: string;
    manager?: EntityManager;
  }) {
    const repo = params.manager ? params.manager.getRepository(Outbox) : this.outboxRepo;
    const entity = repo.create({
      agregado: params.agregado || 'user',
      tipo_evento: params.tipo,
      clave_agregado: params.claveAgregado,
      payload: params.payload,
    } as any);
    return repo.save(entity);
  }

  async processPending() {
    // placeholder for outbox processing
    return;
  }
}

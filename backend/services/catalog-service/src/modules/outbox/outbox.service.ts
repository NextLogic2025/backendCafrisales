import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OutboxEvent } from './entities/outbox-event.entity';

type OutboxPayload = Record<string, unknown>;

@Injectable()
export class OutboxService {
  constructor(@InjectRepository(OutboxEvent) private repo: Repository<OutboxEvent>) {}

  createEvent(
    tipo_evento: string,
    clave_agregado: string,
    payload: OutboxPayload,
    agregado = 'catalog',
  ) {
    const event = this.repo.create({
      agregado,
      tipo_evento,
      clave_agregado,
      payload,
    });

    return this.repo.save(event);
  }
}

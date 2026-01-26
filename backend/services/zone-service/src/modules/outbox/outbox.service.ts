import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OutboxEvent } from './entities/outbox-event.entity';

@Injectable()
export class OutboxService {
  constructor(@InjectRepository(OutboxEvent) private repo: Repository<OutboxEvent>) {}

  createEvent(tipoEvento: string, claveAgregado: string, payload: Record<string, unknown>, agregado = 'zone') {
    const event = this.repo.create({
      agregado,
      tipoEvento,
      claveAgregado,
      payload,
    });
    return this.repo.save(event);
  }
}

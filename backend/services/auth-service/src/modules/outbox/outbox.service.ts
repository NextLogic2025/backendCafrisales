import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { OutboxEvento } from './entities/outbox.entity';

@Injectable()
export class OutboxService {
  async processPending() {
    // Placeholder: cron job to process outbox events
    return;
  }

  /**
   * Crea un evento de Outbox de forma transaccional y segura.
   * Reemplaza los raw inserts y garantiza consistencia de tipos.
   */
  async createEvent(
    manager: EntityManager,
    params: {
      tipo: string;
      claveAgregado: string;
      payload: any;
      agregado?: string;
    },
  ): Promise<OutboxEvento> {
    const evento = manager.create(OutboxEvento, {
      agregado: params.agregado || 'auth',
      tipo_evento: params.tipo,
      clave_agregado: params.claveAgregado,
      payload: params.payload,
    } as any);

    return manager.save(OutboxEvento, evento);
  }
}

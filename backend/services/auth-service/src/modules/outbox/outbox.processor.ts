import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { OutboxEvento } from './entities/outbox.entity';
import { ConfigService } from '@nestjs/config';
import { IOutboxTransport, OUTBOX_TRANSPORT } from './interfaces/outbox-transport.interface';
import { Credential } from '../auth/entities/credential.entity';

@Injectable()
export class OutboxProcessor {
  private readonly logger = new Logger(OutboxProcessor.name);
  private processing = false;

  constructor(
    @InjectRepository(OutboxEvento)
    private readonly outboxRepo: Repository<OutboxEvento>,
    @InjectRepository(Credential)
    private readonly credRepo: Repository<Credential>,
    private readonly configService: ConfigService,
    @Inject(OUTBOX_TRANSPORT)
    private readonly transport: IOutboxTransport,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async handle() {
    if (this.processing) return;
    this.processing = true;
    try {
      const eventos = await this.outboxRepo.find({ where: { procesado_en: IsNull() }, order: { creado_en: 'ASC' }, take: 10 });
      if (!eventos || eventos.length === 0) return;

      // transport encapsulates HTTP details (DIP)

      const MAX_ATTEMPTS = parseInt(this.configService.get('OUTBOX_MAX_ATTEMPTS') || process.env.OUTBOX_MAX_ATTEMPTS || '5', 10);
      const BASE_DELAY_MS = parseInt(this.configService.get('OUTBOX_BASE_DELAY_MS') || process.env.OUTBOX_BASE_DELAY_MS || '5000', 10);

      for (const evento of eventos) {
        try {
          // Compute next attempt time based on exponential backoff using 'intentos'
          const intentos = (evento as any).intentos || 0;
          const creado = new Date(evento.creado_en).getTime();
          const nextAttempt = creado + BASE_DELAY_MS * Math.pow(2, intentos);
          if (Date.now() < nextAttempt) {
            this.logger.log(`Skipping outbox ${evento.id}, next attempt at ${new Date(nextAttempt).toISOString()}`);
            continue;
          }

          // delegate sending to transport implementation
          await this.transport.dispatch(evento);

          evento.procesado_en = new Date();
          (evento as any).intentos = intentos + 1;
          (evento as any).ultimo_error = null;
          await this.outboxRepo.save(evento);
          this.logger.log(`Outbox evento ${evento.id} procesado.`);
        } catch (err) {
          // Determine HTTP status from various possible error shapes (axios error or Nest HttpException)
          const status = err && err.response && err.response.status ? err.response.status : (err && (err.status || (err.getStatus && err.getStatus && err.getStatus()))) || null;

          // Non-retriable client errors (4xx) except 429 -> mark processed to stop retries.
          if (status && status >= 400 && status < 500 && status !== 429) {
            evento.ultimo_error = `HTTP ${status}: ${(err.response && err.response.data) ? JSON.stringify(err.response.data).slice(0,2000) : (err.message || String(err))}`;

            // If conflict (409), attempt to remove the credential that was previously created in auth
            if (status === 409) {
              try {
                const payload = evento.payload || {};
                const id = (payload && (payload.id || payload.usuario_id)) || null;
                if (id) {
                  await this.credRepo.delete(id);
                  this.logger.warn(`Deleted credential usuario_id=${id} due to downstream 409.`);
                } else if (payload && payload.email) {
                  await this.credRepo.delete({ email: payload.email } as any);
                  this.logger.warn(`Deleted credential email=${payload.email} due to downstream 409.`);
                }
              } catch (delErr) {
                this.logger.error('Failed to delete credential after 409', delErr);
              }
            }

            evento.procesado_en = new Date();
            this.logger.warn(`Outbox ${evento.id} marked processed due to non-retriable HTTP ${status}.`);
            await this.outboxRepo.save(evento);
            continue;
          }

          // increment attempts and store last error; mark processed if max attempts exceeded
          const prev = evento.intentos || 0;
          evento.intentos = prev + 1;
          evento.ultimo_error = (err && err.message) ? err.message.toString().slice(0, 2000) : String(err);

          if (evento.intentos >= MAX_ATTEMPTS) {
            evento.procesado_en = new Date();
            this.logger.error(`Outbox ${evento.id} reached max attempts (${MAX_ATTEMPTS}), marking processed.`);
          } else {
            this.logger.error(`Error procesando outbox ${evento.id}: ${err.message || err}. Attempts=${evento.intentos}`);
          }

          await this.outboxRepo.save(evento);
        }
      }
    } catch (err) {
      this.logger.error('Error general en OutboxProcessor', err);
    } finally {
      this.processing = false;
    }
  }
}

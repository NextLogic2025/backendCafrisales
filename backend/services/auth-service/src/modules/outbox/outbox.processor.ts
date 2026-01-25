import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, LessThan } from 'typeorm';
import { OutboxEvento } from './entities/outbox.entity';
import { ConfigService } from '@nestjs/config';
import { IOutboxTransport, OUTBOX_TRANSPORT } from './interfaces/outbox-transport.interface';
import { OutboxCompensationService } from './services/outbox-compensation.service';

@Injectable()
export class OutboxProcessor {
  private readonly logger = new Logger(OutboxProcessor.name);
  private processing = false;

  constructor(
    @InjectRepository(OutboxEvento)
    private readonly outboxRepo: Repository<OutboxEvento>,
    private readonly configService: ConfigService,
    @Inject(OUTBOX_TRANSPORT)
    private readonly transport: IOutboxTransport,
    private readonly compensationService: OutboxCompensationService,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async handle() {
    if (this.processing) return;
    this.processing = true;
    try {
      const MAX_ATTEMPTS = parseInt(this.configService.get('OUTBOX_MAX_ATTEMPTS') || process.env.OUTBOX_MAX_ATTEMPTS || '5', 10);
      const eventos = await this.outboxRepo.find({ where: { procesado_en: IsNull(), intentos: LessThan(MAX_ATTEMPTS) }, order: { creado_en: 'ASC' }, take: 50 });
      if (!eventos || eventos.length === 0) return;

      for (const evento of eventos) {
        await this.processEvent(evento, MAX_ATTEMPTS);
      }
    } catch (err) {
      this.logger.error('Error general en OutboxProcessor', err);
    } finally {
      this.processing = false;
    }
  }

  private async processEvent(evento: OutboxEvento, MAX_ATTEMPTS: number) {
    try {
      await this.transport.dispatch(evento);
      evento.procesado_en = new Date();
      evento.ultimo_error = null;
      await this.outboxRepo.save(evento);
      this.logger.log(`Outbox evento ${evento.id} procesado.`);
    } catch (err) {
      // extract status if available
      const status = err && err.response && err.response.status ? err.response.status : (err && (err.status || (err.getStatus && err.getStatus && err.getStatus()))) || null;

      evento.intentos = (evento.intentos || 0) + 1;
      evento.ultimo_error = (err && err.message) ? err.message.toString().slice(0, 2000) : String(err);

      const isFatal = (status && status >= 400 && status < 500 && status !== 429) || status === 409;
      const maxRetriesReached = evento.intentos >= MAX_ATTEMPTS;

      if (isFatal || maxRetriesReached) {
        this.logger.warn(`Evento ${evento.id} es fatal o alcanzó max attempts (${evento.intentos}). Ejecutando compensación.`);
        await this.compensationService.compensate(evento, err);
      } else {
        await this.outboxRepo.save(evento);
        this.logger.warn(`Reintento ${evento.intentos}/${MAX_ATTEMPTS} para evento ${evento.id}`);
      }
    }
  }
}

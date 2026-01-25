import { Module } from '@nestjs/common';
import { OutboxService } from './outbox.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboxEvento } from './entities/outbox.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { OutboxProcessor } from './outbox.processor';
import { HttpOutboxTransport } from './transports/http-outbox.transport';
import { OUTBOX_TRANSPORT } from './interfaces/outbox-transport.interface';
import { Credential } from '../auth/entities/credential.entity';
import { HttpS2SAdapter } from '../../common/adapters/http-s2s.adapter';
import { S2S_CLIENT } from '../../common/interfaces/s2s-client.interface';
import { OutboxCompensationService } from './services/outbox-compensation.service';

@Module({
  imports: [TypeOrmModule.forFeature([OutboxEvento, Credential]), ScheduleModule.forRoot()],
  providers: [
    OutboxService,
    OutboxProcessor,
    OutboxCompensationService,
    HttpOutboxTransport,
    HttpS2SAdapter,
    {
      provide: S2S_CLIENT,
      useClass: HttpS2SAdapter,
    },
    {
      provide: OUTBOX_TRANSPORT,
      useClass: HttpOutboxTransport,
    },
  ],
  exports: [OutboxService],
})
export class OutboxModule {}

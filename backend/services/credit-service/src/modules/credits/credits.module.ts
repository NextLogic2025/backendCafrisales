import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditsService } from './credits.service';
import { CreditsController } from './credits.controller';
import { AprobacionCredito } from './entities/aprobacion-credito.entity';
import { OutboxModule } from '../outbox/outbox.module';
import { HistoryModule } from '../history/history.module';

@Module({
    imports: [TypeOrmModule.forFeature([AprobacionCredito]), OutboxModule, HistoryModule],
    controllers: [CreditsController],
    providers: [CreditsService],
    exports: [CreditsService],
})
export class CreditsModule { }

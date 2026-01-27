import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PagoCredito } from './entities/pago-credito.entity';
import { CreditsModule } from '../credits/credits.module';
import { OutboxModule } from '../outbox/outbox.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([PagoCredito]),
        CreditsModule,
        OutboxModule,
    ],
    controllers: [PaymentsController],
    providers: [PaymentsService],
    exports: [PaymentsService],
})
export class PaymentsModule { }

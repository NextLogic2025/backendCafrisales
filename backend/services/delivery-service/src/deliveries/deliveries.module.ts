import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveriesController } from './deliveries.controller';
import { DeliveriesInternalController } from './deliveries.internal.controller';
import { DeliveriesService } from './deliveries.service';
import { Entrega } from './entities/entrega.entity';
import { EvidenciaEntrega } from '../evidence/entities/evidencia-entrega.entity';
import { HistorialEstadoEntrega } from '../history/entities/historial-estado-entrega.entity';
import { OutboxModule } from '../outbox/outbox.module';
import { HistoryModule } from '../history/history.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Entrega, EvidenciaEntrega, HistorialEstadoEntrega]),
        OutboxModule,
        HistoryModule,
    ],
    controllers: [DeliveriesController, DeliveriesInternalController],
    providers: [DeliveriesService],
    exports: [DeliveriesService],
})
export class DeliveriesModule { }

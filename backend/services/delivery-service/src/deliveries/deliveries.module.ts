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
import { IncidentsModule } from '../incidents/incidents.module';
import { OrderExternalService } from '../services/order-external.service';
import { S2S_CLIENT } from '../common/interfaces/s2s-client.interface';
import { HttpS2SAdapter } from '../common/adapters/http-s2s.adapter';

@Module({
    imports: [
        TypeOrmModule.forFeature([Entrega, EvidenciaEntrega, HistorialEstadoEntrega]),
        OutboxModule,
        HistoryModule,
        IncidentsModule,
    ],
    controllers: [DeliveriesController, DeliveriesInternalController],
    providers: [
        DeliveriesService,
        OrderExternalService,
        {
            provide: S2S_CLIENT,
            useClass: HttpS2SAdapter,
        },
    ],
    exports: [DeliveriesService],
})
export class DeliveriesModule { }

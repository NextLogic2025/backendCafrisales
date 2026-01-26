import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistorialEstadoEntrega } from './entities/historial-estado-entrega.entity';
import { DeliveryHistorySubscriber } from './delivery-history.subscriber';

@Module({
    imports: [TypeOrmModule.forFeature([HistorialEstadoEntrega])],
    providers: [DeliveryHistorySubscriber],
    exports: [],
})
export class HistoryModule { }

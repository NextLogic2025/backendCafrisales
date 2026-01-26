import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistorialEstadoPedido } from './entities/historial-estado-pedido.entity';

@Module({
    imports: [TypeOrmModule.forFeature([HistorialEstadoPedido])],
})
export class HistoryModule { }

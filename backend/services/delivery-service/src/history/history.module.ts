import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistorialEstadoEntrega } from './entities/historial-estado-entrega.entity';

@Module({
    imports: [TypeOrmModule.forFeature([HistorialEstadoEntrega])],
    exports: [TypeOrmModule],
})
export class HistoryModule { }

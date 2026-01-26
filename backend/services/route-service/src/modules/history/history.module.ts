import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistorialEstadoRutero } from './entities/historial-estado-rutero.entity';

@Module({
    imports: [TypeOrmModule.forFeature([HistorialEstadoRutero])],
})
export class HistoryModule { }

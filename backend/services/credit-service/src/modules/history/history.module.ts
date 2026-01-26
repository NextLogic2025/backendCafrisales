import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistorialEstadoCredito } from './entities/historial-estado-credito.entity';

@Module({
    imports: [TypeOrmModule.forFeature([HistorialEstadoCredito])],
})
export class HistoryModule { }

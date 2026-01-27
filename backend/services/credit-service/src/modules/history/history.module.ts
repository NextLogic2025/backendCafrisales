import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistorialEstadoCredito } from './entities/historial-estado-credito.entity';
import { HistoryService } from './history.service';
import { HistoryController } from './history.controller';

@Module({
    imports: [TypeOrmModule.forFeature([HistorialEstadoCredito])],
    providers: [HistoryService],
    controllers: [HistoryController],
    exports: [HistoryService],
})
export class HistoryModule { }

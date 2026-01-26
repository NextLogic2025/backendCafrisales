import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogisticsService } from './logistics.service';
import { LogisticsController } from './logistics.controller';
import { RuteroLogistico } from './entities/rutero-logistico.entity';
import { ParadaRuteroLogistico } from './entities/parada-rutero-logistico.entity';

@Module({
    imports: [TypeOrmModule.forFeature([RuteroLogistico, ParadaRuteroLogistico])],
    controllers: [LogisticsController],
    providers: [LogisticsService],
    exports: [LogisticsService],
})
export class LogisticsModule { }

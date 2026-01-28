import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogisticsService } from './logistics.service';
import { LogisticsController } from './logistics.controller';
import { RuteroLogistico } from './entities/rutero-logistico.entity';
import { ParadaRuteroLogistico } from './entities/parada-rutero-logistico.entity';
import { Vehiculo } from '../fleet/entities/vehiculo.entity';
import { OutboxModule } from '../outbox/outbox.module';
import { ExternalServicesModule } from '../../services/external-services.module';

/**
 * Módulo de rutas logísticas.
 * Gestiona los ruteros de transportistas y entregas.
 */
@Module({
    imports: [
        TypeOrmModule.forFeature([RuteroLogistico, ParadaRuteroLogistico, Vehiculo]),
        OutboxModule,
        ExternalServicesModule,
    ],
    controllers: [LogisticsController],
    providers: [LogisticsService],
    exports: [LogisticsService],
})
export class LogisticsModule {}

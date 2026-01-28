import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommercialService } from './commercial.service';
import { CommercialController } from './commercial.controller';
import { CommercialStopsController } from './commercial-stops.controller';
import { RuteroComercial } from './entities/rutero-comercial.entity';
import { ParadaRuteroComercial } from './entities/parada-rutero-comercial.entity';
import { OutboxModule } from '../outbox/outbox.module';
import { ExternalServicesModule } from '../../services/external-services.module';

/**
 * Módulo de rutas comerciales.
 * Gestiona los ruteros de vendedores y sus paradas.
 */
@Module({
    imports: [
        TypeOrmModule.forFeature([RuteroComercial, ParadaRuteroComercial]),
        OutboxModule,
        ExternalServicesModule,
    ],
    controllers: [CommercialController, CommercialStopsController],
    providers: [CommercialService],
    exports: [CommercialService],
})
export class CommercialModule {}

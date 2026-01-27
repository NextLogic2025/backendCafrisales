import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommercialService } from './commercial.service';
import { CommercialController } from './commercial.controller';
import { CommercialStopsController } from './commercial-stops.controller';
import { RuteroComercial } from './entities/rutero-comercial.entity';
import { ParadaRuteroComercial } from './entities/parada-rutero-comercial.entity';
import { OutboxModule } from '../outbox/outbox.module';

@Module({
    imports: [TypeOrmModule.forFeature([RuteroComercial, ParadaRuteroComercial]), OutboxModule],
    controllers: [CommercialController, CommercialStopsController],
    providers: [CommercialService],
    exports: [CommercialService],
})
export class CommercialModule { }

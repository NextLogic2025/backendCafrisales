import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommercialService } from './commercial.service';
import { CommercialController } from './commercial.controller';
import { RuteroComercial } from './entities/rutero-comercial.entity';
import { ParadaRuteroComercial } from './entities/parada-rutero-comercial.entity';

@Module({
    imports: [TypeOrmModule.forFeature([RuteroComercial, ParadaRuteroComercial])],
    controllers: [CommercialController],
    providers: [CommercialService],
    exports: [CommercialService],
})
export class CommercialModule { }

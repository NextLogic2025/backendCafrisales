import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FleetService } from './fleet.service';
import { FleetController } from './fleet.controller';
import { Vehiculo } from './entities/vehiculo.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Vehiculo])],
    controllers: [FleetController],
    providers: [FleetService],
    exports: [FleetService],
})
export class FleetModule { }

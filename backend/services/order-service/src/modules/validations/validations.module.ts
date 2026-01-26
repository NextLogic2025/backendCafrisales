import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ValidationsService } from './validations.service';
import { ValidationsController } from './validations.controller';
import { ValidacionBodega } from './entities/validacion-bodega.entity';
import { ItemValidacion } from './entities/item-validacion.entity';

@Module({
    imports: [TypeOrmModule.forFeature([ValidacionBodega, ItemValidacion])],
    controllers: [ValidationsController],
    providers: [ValidationsService],
    exports: [ValidationsService],
})
export class ValidationsModule { }

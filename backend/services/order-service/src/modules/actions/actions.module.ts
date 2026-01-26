import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActionsService } from './actions.service';
import { AccionClienteValidacion } from './entities/accion-cliente-validacion.entity';

@Module({
    imports: [TypeOrmModule.forFeature([AccionClienteValidacion])],
    providers: [ActionsService],
    exports: [ActionsService],
})
export class ActionsModule { }

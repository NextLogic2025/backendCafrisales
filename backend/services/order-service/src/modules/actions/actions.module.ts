import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActionsService } from './actions.service';
import { AccionClienteValidacion } from './entities/accion-cliente-validacion.entity';
import { OutboxModule } from '../outbox/outbox.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([AccionClienteValidacion]),
        OutboxModule,
    ],
    providers: [ActionsService],
    exports: [ActionsService],
})
export class ActionsModule { }

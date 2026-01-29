import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';
import { IncidenciaEntrega } from './entities/incidencia-entrega.entity';
import { OutboxModule } from '../outbox/outbox.module';

@Module({
    imports: [TypeOrmModule.forFeature([IncidenciaEntrega]), OutboxModule],
    controllers: [IncidentsController],
    providers: [IncidentsService],
    exports: [IncidentsService],
})
export class IncidentsModule { }

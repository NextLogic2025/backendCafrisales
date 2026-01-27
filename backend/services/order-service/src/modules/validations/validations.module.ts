import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ValidationsService } from './validations.service';
import { ValidationsController } from './validations.controller';
import { ValidacionBodega } from './entities/validacion-bodega.entity';
import { ItemValidacion } from './entities/item-validacion.entity';
import { Pedido } from '../orders/entities/pedido.entity';
import { ItemPedido } from '../orders/entities/item-pedido.entity';
import { OutboxModule } from '../outbox/outbox.module';
import { ExternalServicesModule } from '../external-services/external-services.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([ValidacionBodega, ItemValidacion, Pedido, ItemPedido]),
        OutboxModule,
        ExternalServicesModule,
    ],
    controllers: [ValidationsController],
    providers: [ValidationsService],
    exports: [ValidationsService],
})
export class ValidationsModule { }

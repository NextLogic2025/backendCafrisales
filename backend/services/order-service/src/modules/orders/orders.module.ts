import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrdersInternalController } from './orders.internal.controller';
import { Pedido } from './entities/pedido.entity';
import { ItemPedido } from './entities/item-pedido.entity';
import { HistorialEstadoPedido } from '../history/entities/historial-estado-pedido.entity';
import { OutboxModule } from '../outbox/outbox.module';
import { ValidationsModule } from '../validations/validations.module';
import { ActionsModule } from '../actions/actions.module';
import { ExternalServicesModule } from '../external-services/external-services.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Pedido, ItemPedido, HistorialEstadoPedido]),
        OutboxModule,
        ValidationsModule,
        ActionsModule,
        ExternalServicesModule,
    ],
    controllers: [OrdersController, OrdersInternalController],
    providers: [OrdersService],
    exports: [OrdersService],
})
export class OrdersModule { }

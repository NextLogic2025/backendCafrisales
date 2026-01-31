import { Body, Controller, Get, Param, Patch, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { ServiceTokenGuard } from '../../common/guards/service-token.guard';
import { EstadoPedido } from '../../common/constants/order-status.enum';

/**
 * Controlador interno para comunicación S2S (servicio a servicio).
 * No requiere JWT de usuario, solo ServiceTokenGuard.
 */
@Controller('internal/pedidos')
@UseGuards(ServiceTokenGuard)
export class OrdersInternalController {
    constructor(private readonly ordersService: OrdersService) {}

    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.ordersService.findOne(id);
    }

    @Patch(':id/estado')
    updateEstado(
        @Param('id', ParseUUIDPipe) id: string,
        @Body('estado') estado: EstadoPedido,
    ) {
        return this.ordersService.updateStatus(id, estado);
    }
}

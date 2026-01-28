import { Controller, Get, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { ServiceTokenGuard } from '../../common/guards/service-token.guard';

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
}

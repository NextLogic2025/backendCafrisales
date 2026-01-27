import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { ServiceTokenGuard } from '../../common/guards/service-token.guard';

@Controller('internal/pedidos')
@UseGuards(ServiceTokenGuard)
export class OrdersInternalController {
    constructor(private readonly ordersService: OrdersService) {}

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.ordersService.findOne(id);
    }
}

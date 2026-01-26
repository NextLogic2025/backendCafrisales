import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RolUsuario } from '../../../common/constants/rol-usuario.enum';
import { EstadoPedido } from '../../../common/constants/order-status.enum';

@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.CLIENTE, RolUsuario.VENDEDOR, RolUsuario.ADMIN)
    create(@Body() dto: CreateOrderDto, @CurrentUser() user: any) {
        // If user is cliente, force cliente_id to be their own ID
        if (user.role === RolUsuario.CLIENTE) {
            dto.cliente_id = user.userId;
        }
        return this.ordersService.create(dto);
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.VENDEDOR, RolUsuario.BODEGUERO, RolUsuario.SUPERVISOR)
    findAll() {
        return this.ordersService.findAll();
    }

    @Get('my-orders')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.CLIENTE)
    findMyOrders(@CurrentUser() user: any) {
        return this.ordersService.findByClient(user.userId);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    findOne(@Param('id') id: string) {
        return this.ordersService.findOne(id);
    }

    @Patch(':id/status')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.BODEGUERO, RolUsuario.SUPERVISOR)
    updateStatus(@Param('id') id: string, @Body('estado') estado: EstadoPedido) {
        return this.ordersService.updateStatus(id, estado);
    }

    @Patch(':id/cancel')
    @UseGuards(JwtAuthGuard)
    cancel(@Param('id') id: string) {
        return this.ordersService.cancel(id);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN)
    remove(@Param('id') id: string) {
        return this.ordersService.remove(id);
    }
}

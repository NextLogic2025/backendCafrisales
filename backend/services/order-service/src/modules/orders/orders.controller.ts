import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateValidacionDto } from '../validations/dto/create-validacion.dto';
import { ValidationsService } from '../validations/validations.service';
import { CreateAccionDto } from '../actions/dto/create-accion.dto';
import { ActionsService } from '../actions/actions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolUsuario } from '../../common/constants/rol-usuario.enum';
import { EstadoPedido } from '../../common/constants/order-status.enum';
import { MetodoPago } from '../../common/constants/payment-method.enum';

@Controller('pedidos')
export class OrdersController {
    constructor(
        private readonly ordersService: OrdersService,
        private readonly validationsService: ValidationsService,
        private readonly actionsService: ActionsService,
    ) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.CLIENTE, RolUsuario.VENDEDOR, RolUsuario.ADMIN)
    create(@Body() dto: CreateOrderDto, @CurrentUser() user: any) {
        return this.ordersService.create(dto, user);
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

    @Get('pending-validation')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.BODEGUERO, RolUsuario.ADMIN)
    findPendingValidation(@Query('limit') limit?: string) {
        const parsedLimit = limit ? Number(limit) : undefined;
        return this.ordersService.findPendingValidation(parsedLimit);
    }

    @Get('zona')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.SUPERVISOR, RolUsuario.ADMIN)
    findByZone(
        @Query('zona_id') zonaId: string,
        @Query('fecha_entrega') fechaEntrega: string,
        @Query('estado') estado?: string,
        @Query('limit') limit?: string,
    ) {
        const parsedLimit = limit ? Number(limit) : undefined;
        const estados = estado
            ? estado.split(',').map((value) => value.trim() as EstadoPedido)
            : undefined;
        return this.ordersService.findByZoneAndDate(zonaId, fechaEntrega, estados, parsedLimit);
    }

    @Post(':id/validar')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.BODEGUERO, RolUsuario.ADMIN)
    validarPedido(@Param('id') id: string, @Body() dto: CreateValidacionDto) {
        dto.pedido_id = id;
        return this.validationsService.create(dto);
    }

    @Post(':id/responder-ajuste')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.CLIENTE)
    responderAjuste(@Param('id') id: string, @Body() dto: CreateAccionDto, @CurrentUser() user: any) {
        dto.pedido_id = id;
        dto.cliente_id = user.userId;
        return this.actionsService.respondToAdjustment(dto, user.userId);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    findOne(@Param('id') id: string) {
        return this.ordersService.findOne(id);
    }

    @Patch(':id/status')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.BODEGUERO, RolUsuario.SUPERVISOR)
    updateStatus(@Param('id') id: string, @Body('estado') estado: EstadoPedido, @CurrentUser() user: any) {
        return this.ordersService.updateStatus(id, estado, user);
    }

    @Patch(':id/cancel')
    @UseGuards(JwtAuthGuard)
    cancel(@Param('id') id: string, @Body('motivo') motivo: string, @CurrentUser() user: any) {
        return this.ordersService.cancel(id, motivo, user.userId);
    }

    @Patch(':id/metodo-pago')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.VENDEDOR)
    updateMetodoPago(
        @Param('id') id: string,
        @Body('metodo_pago') metodoPago: MetodoPago,
        @CurrentUser() user: any,
    ) {
        return this.ordersService.updatePaymentMethod(id, metodoPago, user);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN)
    remove(@Param('id') id: string) {
        return this.ordersService.remove(id);
    }
}

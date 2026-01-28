import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Query, ParseUUIDPipe, ParseIntPipe } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ApprovePromosDto } from './dto/approve-promos.dto';
import { RejectPromosDto } from './dto/reject-promos.dto';
import { CreateValidacionDto } from '../validations/dto/create-validacion.dto';
import { ValidationsService } from '../validations/validations.service';
import { CreateAccionDto } from '../actions/dto/create-accion.dto';
import { ActionsService } from '../actions/actions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
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
    create(@Body() dto: CreateOrderDto, @CurrentUser() user: AuthUser) {
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
    findMyOrders(@CurrentUser() user: AuthUser) {
        return this.ordersService.findByClient(user.userId);
    }

    @Get('pending-validation')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.BODEGUERO, RolUsuario.ADMIN)
    findPendingValidation(@Query('limit', new ParseIntPipe({ optional: true })) limit?: number) {
        return this.ordersService.findPendingValidation(limit);
    }

    @Get('promociones-pendientes')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.SUPERVISOR, RolUsuario.ADMIN)
    findPendingPromoApprovals(@Query('limit', new ParseIntPipe({ optional: true })) limit?: number) {
        return this.ordersService.findPendingPromoApproval(limit);
    }

    @Get('zona')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.SUPERVISOR, RolUsuario.ADMIN)
    findByZone(
        @Query('zona_id', ParseUUIDPipe) zonaId: string,
        @Query('fecha_entrega') fechaEntrega: string,
        @Query('estado') estado?: string,
        @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    ) {
        const estados = estado
            ? estado.split(',').map((value) => value.trim() as EstadoPedido)
            : undefined;
        return this.ordersService.findByZoneAndDate(zonaId, fechaEntrega, estados, limit);
    }

    @Post(':id/validar')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.BODEGUERO, RolUsuario.ADMIN)
    validarPedido(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateValidacionDto) {
        dto.pedido_id = id;
        return this.validationsService.create(dto);
    }

    @Post(':id/responder-ajuste')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.CLIENTE)
    responderAjuste(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: CreateAccionDto,
        @CurrentUser() user: AuthUser,
    ) {
        dto.pedido_id = id;
        dto.cliente_id = user.userId;
        return this.actionsService.respondToAdjustment(dto, user.userId);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.ordersService.findOne(id);
    }

    @Patch(':id/status')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.BODEGUERO, RolUsuario.SUPERVISOR)
    updateStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @Body('estado') estado: EstadoPedido,
        @CurrentUser() user: AuthUser,
    ) {
        return this.ordersService.updateStatus(id, estado, user);
    }

    @Patch(':id/aprobar-promociones')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.SUPERVISOR, RolUsuario.ADMIN)
    approvePromotions(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: ApprovePromosDto,
        @CurrentUser() user: AuthUser,
    ) {
        return this.ordersService.approvePromotions(id, dto, user);
    }

    @Patch(':id/rechazar-promociones')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.SUPERVISOR, RolUsuario.ADMIN)
    rejectPromotions(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: RejectPromosDto,
        @CurrentUser() user: AuthUser,
    ) {
        return this.ordersService.rejectPromotions(id, dto, user);
    }

    @Patch(':id/cancel')
    @UseGuards(JwtAuthGuard)
    cancel(
        @Param('id', ParseUUIDPipe) id: string,
        @Body('motivo') motivo: string,
        @CurrentUser() user: AuthUser,
    ) {
        return this.ordersService.cancel(id, motivo, user.userId);
    }

    @Patch(':id/metodo-pago')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.VENDEDOR)
    updateMetodoPago(
        @Param('id', ParseUUIDPipe) id: string,
        @Body('metodo_pago') metodoPago: MetodoPago,
        @CurrentUser() user: AuthUser,
    ) {
        return this.ordersService.updatePaymentMethod(id, metodoPago, user);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN)
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.ordersService.remove(id);
    }
}

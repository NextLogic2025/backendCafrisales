import { Controller, Get, Post, Body, Param, Patch, Put, Delete, UseGuards, Query, ParseUUIDPipe, ParseIntPipe, Header, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
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
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { OrderFilterDto } from './dto/order-filter.dto';
import { createPaginatedResponse } from '../../common/interfaces/paginated-response.interface';

@ApiTags('orders')
@ApiBearerAuth()
@Controller({ path: 'orders', version: '1' })
export class OrdersController {
    constructor(
        private readonly ordersService: OrdersService,
        private readonly validationsService: ValidationsService,
        private readonly actionsService: ActionsService,
    ) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.CLIENTE, RolUsuario.VENDEDOR, RolUsuario.ADMIN)
    @ApiOperation({ summary: 'Crear nuevo pedido' })
    @HttpCode(HttpStatus.CREATED)
    create(@Body() dto: CreateOrderDto, @CurrentUser() user: AuthUser) {
        return this.ordersService.create(dto, user);
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.VENDEDOR, RolUsuario.BODEGUERO, RolUsuario.SUPERVISOR)
    @ApiOperation({ summary: 'Listar pedidos con paginación y filtros' })
    @Header('Cache-Control', 'no-store')
    async findAll(
        @Query() pagination: PaginationQueryDto,
        @Query() filters: OrderFilterDto,
    ) {
        return this.ordersService.findAllPaginated(pagination, filters);
    }

    @Get('stats')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR, RolUsuario.VENDEDOR)
    @ApiOperation({ summary: 'Obtener estadísticas de pedidos' })
    findStats(@CurrentUser() user: AuthUser) {
        // If seller, filter by their ID
        const sellerId = user.role === RolUsuario.VENDEDOR ? user.userId : undefined;
        return this.ordersService.getStats(sellerId);
    }

    @Get('my-orders')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.CLIENTE)
    @ApiOperation({ summary: 'Listar pedidos del cliente autenticado' })
    async findMyOrders(
        @Query() pagination: PaginationQueryDto,
        @CurrentUser() user: AuthUser,
    ) {
        // Reusing paginated method for my-orders
        const filters = new OrderFilterDto();
        filters.customerId = user.userId;
        return this.ordersService.findAllPaginated(pagination, filters);
    }

    @Get(':id/items')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Listar items del pedido' })
    async findItems(@Param('id', ParseUUIDPipe) id: string) {
        const order = await this.ordersService.findOne(id);
        return order.items;
    }

    @Get(':id/history')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Ver historial de cambios del pedido' })
    async findHistory(@Param('id', ParseUUIDPipe) id: string) {
        const order = await this.ordersService.findOne(id);
        return order.historial;
    }

    @Get('pending-validation')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.BODEGUERO, RolUsuario.ADMIN)
    @ApiOperation({ summary: 'Listar pedidos pendientes de validación' })
    findPendingValidation(@Query('limit', new ParseIntPipe({ optional: true })) limit?: number) {
        return this.ordersService.findPendingValidation(limit);
    }

    @Get('promociones-pendientes')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.SUPERVISOR, RolUsuario.ADMIN)
    @ApiOperation({ summary: 'Listar pedidos con promociones pendientes' })
    findPendingPromoApprovals(@Query('limit', new ParseIntPipe({ optional: true })) limit?: number) {
        return this.ordersService.findPendingPromoApproval(limit);
    }

    @Get('zona')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.SUPERVISOR, RolUsuario.ADMIN)
    @ApiOperation({ summary: 'Listar pedidos por zona y fecha' })
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

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Obtener pedido por ID' })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.ordersService.findOne(id);
    }

    @Post(':id/validar')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.BODEGUERO, RolUsuario.ADMIN)
    @ApiOperation({ summary: 'Validar pedido' })
    @HttpCode(HttpStatus.CREATED)
    validarPedido(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateValidacionDto) {
        dto.pedido_id = id;
        return this.validationsService.create(dto);
    }

    @Post(':id/responder-ajuste')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.CLIENTE)
    @ApiOperation({ summary: 'Responder a ajuste de pedido' })
    @HttpCode(HttpStatus.OK)
    responderAjuste(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: CreateAccionDto,
        @CurrentUser() user: AuthUser,
    ) {
        dto.pedido_id = id;
        dto.cliente_id = user.userId;
        return this.actionsService.respondToAdjustment(dto, user.userId);
    }

    @Post(':id/status')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.BODEGUERO, RolUsuario.SUPERVISOR)
    @ApiOperation({ summary: 'Actualizar estado del pedido' })
    @HttpCode(HttpStatus.OK)
    updateStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @Body('estado') estado: EstadoPedido,
        @CurrentUser() user: AuthUser,
    ) {
        return this.ordersService.updateStatus(id, estado, user);
    }

    @Post(':id/aprobar-promociones')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.SUPERVISOR, RolUsuario.ADMIN)
    @ApiOperation({ summary: 'Aprobar promociones' })
    @HttpCode(HttpStatus.OK)
    approvePromotions(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: ApprovePromosDto,
        @CurrentUser() user: AuthUser,
    ) {
        return this.ordersService.approvePromotions(id, dto, user);
    }

    @Post(':id/rechazar-promociones')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.SUPERVISOR, RolUsuario.ADMIN)
    @ApiOperation({ summary: 'Rechazar promociones' })
    @HttpCode(HttpStatus.OK)
    rejectPromotions(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: RejectPromosDto,
        @CurrentUser() user: AuthUser,
    ) {
        return this.ordersService.rejectPromotions(id, dto, user);
    }

    @Put(':id/cancel')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Cancelar pedido' })
    @HttpCode(HttpStatus.OK)
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
    @ApiOperation({ summary: 'Actualizar método de pago' })
    @HttpCode(HttpStatus.OK)
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
    @ApiOperation({ summary: 'Eliminar pedido' })
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.ordersService.remove(id);
    }
}

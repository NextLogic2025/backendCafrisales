import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LogisticsService } from './logistics.service';
import { CreateLogisticRouteDto, AddOrderDto, CancelRuteroDto, UpdateVehicleDto } from './dto/logistics-route.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { RolUsuario } from '../../common/constants/rol-usuario.enum';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { RouteFilterDto } from './dto/route-filter.dto';
import { createPaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import { RouteAssignmentDto } from './dto/route-assignment.dto';
import { RouteStatusDto } from './dto/route-status.dto';

@ApiTags('routes')
@ApiBearerAuth()
@Controller({ path: 'routes', version: '1' })
export class LogisticsController {
    constructor(private readonly logisticsService: LogisticsService) { }

    @Post()
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    @ApiOperation({ summary: 'Crear nueva ruta' })
    @HttpCode(HttpStatus.CREATED)
    create(@Body() dto: CreateLogisticRouteDto, @CurrentUser() user: AuthUser) {
        return this.logisticsService.create(dto, user.userId);
    }

    @Get()
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR, RolUsuario.TRANSPORTISTA, RolUsuario.BODEGUERO)
    @ApiOperation({ summary: 'Listar rutas con paginación y filtros' })
    async findAll(
        @Query() pagination: PaginationQueryDto,
        @Query() filters: RouteFilterDto,
        @CurrentUser() user: AuthUser,
    ) {
        const visibleTo = user.role === RolUsuario.TRANSPORTISTA ? user.userId : undefined;
        return this.logisticsService.findAllPaginated(pagination, filters, visibleTo);
    }

    @Get('my-routes')
    @Roles(RolUsuario.TRANSPORTISTA)
    @ApiOperation({ summary: 'Listar mis rutas' })
    async findMyRoutes(
        @Query() pagination: PaginationQueryDto,
        @CurrentUser() user: AuthUser,
    ) {
        const filters = new RouteFilterDto();
        filters.driverId = user.userId;
        return this.logisticsService.findAllPaginated(pagination, filters, user.userId);
    }

    @Get('my-routes/today')
    @Roles(RolUsuario.TRANSPORTISTA)
    @ApiOperation({ summary: 'Listar mis rutas de hoy' })
    async findMyRoutesToday(
        @Query() pagination: PaginationQueryDto,
        @CurrentUser() user: AuthUser,
    ) {
        const filters = new RouteFilterDto();
        filters.driverId = user.userId;
        filters.date = new Date().toISOString().split('T')[0];
        return this.logisticsService.findAllPaginated(pagination, filters, user.userId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener ruta por ID' })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.logisticsService.findOne(id);
    }

    @Get(':id/history')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR, RolUsuario.TRANSPORTISTA)
    @ApiOperation({ summary: 'Ver historial de la ruta' })
    getHistory(@Param('id', ParseUUIDPipe) id: string) {
        return this.logisticsService.getHistory(id);
    }

    @Get(':id/stops')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR, RolUsuario.TRANSPORTISTA)
    @ApiOperation({ summary: 'Listar paradas de la ruta' })
    async getStops(@Param('id', ParseUUIDPipe) id: string) {
        const route = await this.logisticsService.findOne(id);
        return route.paradas;
    }

    @Post(':id/assignment')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    @ApiOperation({ summary: 'Asignar transportista' })
    @HttpCode(HttpStatus.OK)
    assignDriver(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: RouteAssignmentDto,
        @CurrentUser() user: AuthUser,
    ) {
        return this.logisticsService.assignDriver(id, dto.driverId, user.userId);
    }

    @Post(':id/status')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR, RolUsuario.TRANSPORTISTA)
    @ApiOperation({ summary: 'Cambiar estado de la ruta' })
    @HttpCode(HttpStatus.OK)
    changeStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: RouteStatusDto,
        @CurrentUser() user: AuthUser,
    ) {
        // Map status to specific methods
        if (dto.status === 'publicado') return this.logisticsService.publish(id, user.userId);
        if (dto.status === 'en_curso') return this.logisticsService.start(id, user.userId);
        if (dto.status === 'completado') return this.logisticsService.complete(id, user.userId);
        if (dto.status === 'cancelado') return this.logisticsService.cancel(id, user.userId);

        throw new BadRequestException('Estado no manejado por endpoint genérico o transición inválida');
    }

    @Post(':id/optimize')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    @ApiOperation({ summary: 'Optimizar ruta' })
    @HttpCode(HttpStatus.OK)
    optimize(@Param('id', ParseUUIDPipe) id: string) {
        return this.logisticsService.optimizeRoute(id);
    }

    @Post(':id/clone')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    @ApiOperation({ summary: 'Clonar ruta' })
    @HttpCode(HttpStatus.CREATED)
    clone(
        @Param('id', ParseUUIDPipe) id: string,
        @Body('date') date: string,
        @CurrentUser() user: AuthUser,
    ) {
        return this.logisticsService.cloneRoute(id, new Date(date), user.userId);
    }

    // Legacy/Specific methods kept or refactored

    @Put(':id/publicar')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    publish(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
        return this.logisticsService.publish(id, user.userId);
    }

    @Put(':id/iniciar')
    @Roles(RolUsuario.TRANSPORTISTA)
    start(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
        return this.logisticsService.start(id, user.userId);
    }

    @Put(':id/completar')
    @Roles(RolUsuario.TRANSPORTISTA)
    complete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
        return this.logisticsService.complete(id, user.userId);
    }

    @Put(':id/cancelar')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    cancel(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: CancelRuteroDto,
        @CurrentUser() user: AuthUser,
    ) {
        return this.logisticsService.cancel(id, user.userId, dto?.motivo);
    }

    @Post(':id/orders')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    addOrder(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddOrderDto) {
        return this.logisticsService.addOrder(id, dto);
    }

    @Delete(':id/orders/:pedidoId')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    removeOrder(
        @Param('id', ParseUUIDPipe) id: string,
        @Param('pedidoId', ParseUUIDPipe) pedidoId: string,
    ) {
        return this.logisticsService.removeOrder(id, pedidoId);
    }

    @Put(':id/vehiculo')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    updateVehicle(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateVehicleDto,
        @CurrentUser() user: AuthUser,
    ) {
        return this.logisticsService.updateVehicle(id, dto, user.userId);
    }

    @Put(':id/paradas/:pedidoId/preparar')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR, RolUsuario.BODEGUERO)
    prepareStop(
        @Param('id', ParseUUIDPipe) id: string,
        @Param('pedidoId', ParseUUIDPipe) pedidoId: string,
        @CurrentUser() user: AuthUser,
    ) {
        return this.logisticsService.prepareStop(id, pedidoId, user.userId);
    }
}

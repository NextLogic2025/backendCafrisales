import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    UseGuards,
    Header,
    HttpCode,
    HttpStatus,
    Patch,
    Post,
    Put,
    Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DeliveriesService } from './deliveries.service';
import {
    CancelDeliveryDto,
    CompleteDeliveryDto,
    CompletePartialDeliveryDto,
    LocationUpdateDto,
    NoDeliveryDto,
} from './dto/create-delivery.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolUsuario } from '../common/constants/rol-usuario.enum';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { DeliveryFilterDto } from './dto/delivery-filter.dto';
import { createPaginatedResponse } from '../common/interfaces/paginated-response.interface';

@ApiTags('deliveries')
@ApiBearerAuth()
@Controller({ path: 'deliveries', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeliveriesController {
    constructor(
        private readonly deliveriesService: DeliveriesService,
    ) { }

    @Get()
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR, RolUsuario.TRANSPORTISTA, RolUsuario.BODEGUERO)
    @ApiOperation({ summary: 'Listar entregas con paginación y filtros' })
    @Header('Cache-Control', 'no-store')
    async findAll(
        @Query() pagination: PaginationQueryDto,
        @Query() filters: DeliveryFilterDto,
    ) {
        return this.deliveriesService.findAllPaginated(pagination, filters);
    }

    @Get(':id')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR, RolUsuario.TRANSPORTISTA)
    @ApiOperation({ summary: 'Obtener entrega por ID' })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.deliveriesService.findOne(id);
    }

    @Get(':id/history')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR, RolUsuario.TRANSPORTISTA)
    @ApiOperation({ summary: 'Obtener historial de entrega' })
    findHistory(@Param('id', ParseUUIDPipe) id: string) {
        return this.deliveriesService.findHistory(id);
    }

    @Put(':id/start')
    @Roles(RolUsuario.TRANSPORTISTA)
    @ApiOperation({ summary: 'Marcar entrega en ruta' })
    @HttpCode(HttpStatus.OK)
    markEnRuta(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user?: AuthUser,
    ) {
        return this.deliveriesService.markEnRuta(id, user?.userId);
    }

    @Patch(':id/location')
    @Roles(RolUsuario.TRANSPORTISTA)
    @ApiOperation({ summary: 'Actualizar ubicación GPS' })
    @HttpCode(HttpStatus.OK)
    @Header('Cache-Control', 'no-store')
    updateLocation(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: LocationUpdateDto,
        @CurrentUser() user?: AuthUser,
    ) {
        return this.deliveriesService.updateLocation(id, dto.latitud, dto.longitud, user?.userId);
    }

    @Post(':id/complete')
    @Roles(RolUsuario.TRANSPORTISTA)
    @ApiOperation({ summary: 'Completar entrega' })
    @HttpCode(HttpStatus.OK)
    completeDelivery(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: CompleteDeliveryDto,
        @CurrentUser() user?: AuthUser,
    ) {
        return this.deliveriesService.completeDelivery(id, dto, user?.userId);
    }

    @Post(':id/complete-partial')
    @Roles(RolUsuario.TRANSPORTISTA)
    @ApiOperation({ summary: 'Completar entrega parcialmente' })
    @HttpCode(HttpStatus.OK)
    completePartialDelivery(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: CompletePartialDeliveryDto,
        @CurrentUser() user?: AuthUser,
    ) {
        return this.deliveriesService.completePartialDelivery(id, dto, user?.userId);
    }

    @Post(':id/fail')
    @Roles(RolUsuario.TRANSPORTISTA)
    @ApiOperation({ summary: 'Marcar como no entregado' })
    @HttpCode(HttpStatus.OK)
    markNoDelivery(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: NoDeliveryDto,
        @CurrentUser() user?: AuthUser,
    ) {
        return this.deliveriesService.markNoDelivery(id, dto, user?.userId);
    }

    @Put(':id/cancel')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    @ApiOperation({ summary: 'Cancelar entrega' })
    @HttpCode(HttpStatus.OK)
    cancel(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: CancelDeliveryDto,
        @CurrentUser() user?: AuthUser,
    ) {
        return this.deliveriesService.cancelDelivery(id, dto, user?.userId);
    }
}
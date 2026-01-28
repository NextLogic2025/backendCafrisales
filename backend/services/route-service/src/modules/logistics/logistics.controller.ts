import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { LogisticsService } from './logistics.service';
import { CreateLogisticRouteDto, AddOrderDto, CancelRuteroDto } from './dto/logistics-route.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { RolUsuario } from '../../common/constants/rol-usuario.enum';

@Controller('ruteros-logisticos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LogisticsController {
    constructor(private readonly logisticsService: LogisticsService) { }

    @Post()
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    create(@Body() dto: CreateLogisticRouteDto, @CurrentUser() user: AuthUser) {
        return this.logisticsService.create(dto, user.userId);
    }

    @Get()
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR, RolUsuario.TRANSPORTISTA)
    findAll(
        @Query('transportista_id') transportistaId?: string,
        @Query('estado') estado?: string,
        @CurrentUser() user?: AuthUser,
    ) {
        const estados = estado ? estado.split(',').map((e) => e.trim()).filter(Boolean) : undefined;
        if (user?.role === RolUsuario.TRANSPORTISTA) {
            return this.logisticsService.findAll(user.userId, estados);
        }
        return this.logisticsService.findAll(transportistaId, estados);
    }

    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.logisticsService.findOne(id);
    }

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
}

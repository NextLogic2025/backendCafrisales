import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { CommercialService } from './commercial.service';
import { CreateCommercialRouteDto, AddVisitDto, CancelRuteroDto } from './dto/commercial-route.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { RolUsuario } from '../../common/constants/rol-usuario.enum';

@Controller('ruteros-comerciales')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommercialController {
    constructor(private readonly commercialService: CommercialService) { }

    @Post()
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    create(@Body() dto: CreateCommercialRouteDto, @CurrentUser() user: AuthUser) {
        return this.commercialService.create(dto, user.userId);
    }

    @Get()
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR, RolUsuario.VENDEDOR)
    findAll(@Query('vendedor_id') vendedorId?: string, @Query('fecha_desde') fechaDesde?: string, @CurrentUser() user?: AuthUser) {
        if (user?.role === RolUsuario.VENDEDOR) {
            return this.commercialService.getBySeller(user.userId, fechaDesde);
        }
        if (vendedorId) {
            return this.commercialService.getBySeller(vendedorId, fechaDesde);
        }
        return this.commercialService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.commercialService.findOne(id);
    }

    @Put(':id/publicar')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    publish(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
        return this.commercialService.publish(id, user.userId);
    }

    @Put(':id/iniciar')
    @Roles(RolUsuario.VENDEDOR)
    start(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
        return this.commercialService.start(id, user.userId);
    }

    @Put(':id/completar')
    @Roles(RolUsuario.VENDEDOR)
    complete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
        return this.commercialService.complete(id, user.userId);
    }

    @Put(':id/cancelar')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    cancel(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: CancelRuteroDto,
        @CurrentUser() user: AuthUser,
    ) {
        return this.commercialService.cancel(id, user.userId, dto?.motivo);
    }

    @Post(':id/visits')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    addVisit(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddVisitDto) {
        return this.commercialService.addVisit(id, dto);
    }
}

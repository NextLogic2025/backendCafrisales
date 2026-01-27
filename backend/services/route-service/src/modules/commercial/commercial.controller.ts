import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CommercialService } from './commercial.service';
import { CreateCommercialRouteDto, AddVisitDto, CancelRuteroDto } from './dto/commercial-route.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolUsuario } from '../../common/constants/rol-usuario.enum';

@Controller('ruteros-comerciales')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommercialController {
    constructor(private readonly commercialService: CommercialService) { }

    @Post()
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    create(@Body() dto: CreateCommercialRouteDto, @CurrentUser() user: any) {
        return this.commercialService.create(dto, user.userId);
    }

    @Get()
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR, RolUsuario.VENDEDOR)
    findAll(@Query('vendedor_id') vendedorId?: string, @Query('fecha_desde') fechaDesde?: string, @CurrentUser() user?: any) {
        if (user?.role === RolUsuario.VENDEDOR) {
            return this.commercialService.getBySeller(user.userId, fechaDesde);
        }
        if (vendedorId) {
            return this.commercialService.getBySeller(vendedorId, fechaDesde);
        }
        return this.commercialService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.commercialService.findOne(id);
    }

    @Put(':id/publicar')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    publish(@Param('id') id: string, @CurrentUser() user: any) {
        return this.commercialService.publish(id, user.userId);
    }

    @Put(':id/iniciar')
    @Roles(RolUsuario.VENDEDOR)
    start(@Param('id') id: string, @CurrentUser() user: any) {
        return this.commercialService.start(id, user.userId);
    }

    @Put(':id/completar')
    @Roles(RolUsuario.VENDEDOR)
    complete(@Param('id') id: string, @CurrentUser() user: any) {
        return this.commercialService.complete(id, user.userId);
    }

    @Put(':id/cancelar')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    cancel(@Param('id') id: string, @Body() dto: CancelRuteroDto, @CurrentUser() user: any) {
        return this.commercialService.cancel(id, user.userId, dto?.motivo);
    }

    // Legacy (optional)
    @Post(':id/visits')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    addVisit(@Param('id') id: string, @Body() dto: AddVisitDto) {
        return this.commercialService.addVisit(id, dto);
    }
}

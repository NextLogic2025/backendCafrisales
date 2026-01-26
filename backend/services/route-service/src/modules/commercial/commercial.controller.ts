import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { CommercialService } from './commercial.service';
import { CreateCommercialRouteDto, AddVisitDto, UpdateVisitResultDto } from './dto/commercial-route.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolUsuario } from '../../common/constants/rol-usuario.enum';

@Controller('commercial-routes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommercialController {
    constructor(private readonly commercialService: CommercialService) { }

    @Post()
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    create(@Body() dto: CreateCommercialRouteDto, @CurrentUser() user: any) {
        return this.commercialService.create(dto, user.userId);
    }

    @Post(':id/visits')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    addVisit(@Param('id') id: string, @Body() dto: AddVisitDto) {
        return this.commercialService.addVisit(id, dto);
    }

    @Get()
    findAll() {
        return this.commercialService.findAll();
    }

    @Get('my-routes')
    @Roles(RolUsuario.VENDEDOR)
    getMyRoutes(@CurrentUser() user: any) {
        return this.commercialService.getBySeller(user.userId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.commercialService.findOne(id);
    }

    @Patch(':id/publish')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    publish(@Param('id') id: string, @CurrentUser() user: any) {
        return this.commercialService.publish(id, user.userId);
    }

    @Patch('visits/:stopId/result')
    @Roles(RolUsuario.VENDEDOR, RolUsuario.SUPERVISOR)
    registerResult(@Param('stopId') stopId: string, @Body() dto: UpdateVisitResultDto) {
        return this.commercialService.registerVisit(stopId, dto);
    }
}

import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { LogisticsService } from './logistics.service';
import { CreateLogisticRouteDto, AddOrderDto } from './dto/logistics-route.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolUsuario } from '../../common/constants/rol-usuario.enum';

@Controller('logistic-routes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LogisticsController {
    constructor(private readonly logisticsService: LogisticsService) { }

    @Post()
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    create(@Body() dto: CreateLogisticRouteDto, @CurrentUser() user: any) {
        return this.logisticsService.create(dto, user.userId);
    }

    @Post(':id/orders')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    addOrder(@Param('id') id: string, @Body() dto: AddOrderDto) {
        return this.logisticsService.addOrder(id, dto);
    }

    @Get()
    findAll() {
        return this.logisticsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.logisticsService.findOne(id);
    }

    @Patch(':id/publish')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    publish(@Param('id') id: string, @CurrentUser() user: any) {
        return this.logisticsService.publish(id, user.userId);
    }
}

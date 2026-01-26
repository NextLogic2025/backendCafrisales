import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { FleetService } from './fleet.service';
import { CreateVehicleDto, UpdateVehicleStatusDto } from './dto/vehicle.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolUsuario } from '../../common/constants/rol-usuario.enum';

@Controller('fleet')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FleetController {
    constructor(private readonly fleetService: FleetService) { }

    @Post()
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    create(@Body() dto: CreateVehicleDto, @CurrentUser() user: any) {
        return this.fleetService.create(dto, user.userId);
    }

    @Get()
    findAll() {
        return this.fleetService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.fleetService.findOne(id);
    }

    @Patch(':id/status')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    updateStatus(
        @Param('id') id: string,
        @Body() dto: UpdateVehicleStatusDto,
        @CurrentUser() user: any,
    ) {
        return this.fleetService.updateStatus(id, dto, user.userId);
    }
}

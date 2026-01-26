import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    UseGuards,
} from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { ReportIncidentDto } from './dto/report-incident.dto';
import { ResolveIncidentDto } from './dto/resolve-incident.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolUsuario } from '../common/constants/rol-usuario.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('incidents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IncidentsController {
    constructor(private readonly incidentsService: IncidentsService) { }

    @Post(':entregaId')
    @Roles(RolUsuario.ADMIN, RolUsuario.ADMINISTRADOR_LOGISTICA, RolUsuario.CONDUCTOR)
    reportIncident(
        @Param('entregaId') entregaId: string,
        @Body() reportDto: ReportIncidentDto,
        @CurrentUser() user?: any,
    ) {
        return this.incidentsService.reportIncident(entregaId, reportDto, user?.id);
    }

    @Get()
    @Roles(RolUsuario.ADMIN, RolUsuario.ADMINISTRADOR_LOGISTICA)
    findAll() {
        return this.incidentsService.findAll();
    }

    @Get('unresolved')
    @Roles(RolUsuario.ADMIN, RolUsuario.ADMINISTRADOR_LOGISTICA)
    findUnresolved() {
        return this.incidentsService.findUnresolved();
    }

    @Get('delivery/:entregaId')
    @Roles(RolUsuario.ADMIN, RolUsuario.ADMINISTRADOR_LOGISTICA, RolUsuario.CONDUCTOR)
    findByDelivery(@Param('entregaId') entregaId: string) {
        return this.incidentsService.findByDelivery(entregaId);
    }

    @Get(':id')
    @Roles(RolUsuario.ADMIN, RolUsuario.ADMINISTRADOR_LOGISTICA)
    findOne(@Param('id') id: string) {
        return this.incidentsService.findOne(id);
    }

    @Patch(':id/resolve')
    @Roles(RolUsuario.ADMIN, RolUsuario.ADMINISTRADOR_LOGISTICA)
    resolveIncident(
        @Param('id') id: string,
        @Body() resolveDto: ResolveIncidentDto,
        @CurrentUser() user?: any,
    ) {
        return this.incidentsService.resolveIncident(id, resolveDto, user?.id);
    }

    @Delete(':id')
    @Roles(RolUsuario.ADMIN)
    remove(@Param('id') id: string) {
        return this.incidentsService.remove(id);
    }
}

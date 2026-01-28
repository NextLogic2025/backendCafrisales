import { Body, Controller, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { ReportIncidentDto } from './dto/report-incident.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolUsuario } from '../common/constants/rol-usuario.enum';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('entregas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IncidentsDeliveryController {
    constructor(private readonly incidentsService: IncidentsService) { }

    @Post(':entregaId/incidencias')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR, RolUsuario.TRANSPORTISTA)
    reportIncident(
        @Param('entregaId', ParseUUIDPipe) entregaId: string,
        @Body() reportDto: ReportIncidentDto,
        @CurrentUser() user?: AuthUser,
    ) {
        return this.incidentsService.reportIncident(entregaId, reportDto, user?.userId);
    }
}

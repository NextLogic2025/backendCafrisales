import {
    Controller,
    Get,
    Put,
    Post,
    Delete,
    Param,
    ParseUUIDPipe,
    Body,
    UseGuards,
    Query,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { IncidentsService } from './incidents.service';
import { ResolveIncidentDto } from './dto/resolve-incident.dto';
import { ReportIncidentDto } from './dto/report-incident.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolUsuario } from '../common/constants/rol-usuario.enum';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('incidents')
@ApiBearerAuth()
@Controller({ path: 'deliveries/:deliveryId/incidents', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class IncidentsController {
    constructor(private readonly incidentsService: IncidentsService) { }

    @Post()
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR, RolUsuario.TRANSPORTISTA)
    @ApiOperation({ summary: 'Reportar incidencia' })
    @HttpCode(HttpStatus.CREATED)
    reportIncident(
        @Param('deliveryId', ParseUUIDPipe) deliveryId: string,
        @Body() dto: ReportIncidentDto,
        @CurrentUser() user?: AuthUser,
    ) {
        return this.incidentsService.reportIncident(deliveryId, dto, user?.userId);
    }

    @Get()
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    @ApiOperation({ summary: 'Listar incidencias de una entrega' })
    findAllByDelivery(@Param('deliveryId', ParseUUIDPipe) deliveryId: string) {
        // Assuming we want all incidents for this delivery
        // If IncidentsService doesn't have a specific byDelivery method, we might need to filter.
        // But Incidents usually link to Delivery.
        // Using findAll filtering by deliveryId implicitly if feasible, or adding method.
        // For now, let's assume we can add a method findByDelivery to IncidentsService or use existing if any.
        // Checking IncidentsService...
        return this.incidentsService.findByDelivery(deliveryId);
    }

    /* 
       Global List moved to specific admin route or filtered via DeliveryService?
       If global list is absolutely needed, we'd need a separate controller path.
       For now, commenting out the global logic in favor of sub-resource.
       Admin can use Delivery Filter "hasIncidents" then drill down.
    */

    @Get(':id')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    @ApiOperation({ summary: 'Obtener incidencia por ID' })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.incidentsService.findOne(id);
    }

    @Put(':id/resolve')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    @ApiOperation({ summary: 'Resolver incidencia' })
    @HttpCode(HttpStatus.OK)
    resolveIncident(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() resolveDto: ResolveIncidentDto,
        @CurrentUser() user?: AuthUser,
    ) {
        return this.incidentsService.resolveIncident(id, resolveDto, user?.userId);
    }

    @Delete(':id')
    @Roles(RolUsuario.ADMIN)
    @ApiOperation({ summary: 'Eliminar incidencia' })
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.incidentsService.remove(id);
    }
}

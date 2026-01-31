import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Post,
    Put,
    Query,
    UseGuards,
} from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';
import {
    CancelDeliveryDto,
    CompleteDeliveryDto,
    CompletePartialDeliveryDto,
    EvidenceInputDto,
    NoDeliveryDto,
} from './dto/create-delivery.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolUsuario } from '../common/constants/rol-usuario.enum';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { IncidentsService } from '../incidents/incidents.service';
import { ReportIncidentDto } from '../incidents/dto/report-incident.dto';

@Controller('entregas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeliveriesController {
    constructor(
        private readonly deliveriesService: DeliveriesService,
        private readonly incidentsService: IncidentsService,
    ) { }

    @Get()
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR, RolUsuario.TRANSPORTISTA, RolUsuario.BODEGUERO)
    findAll(
        @Query('transportista_id') transportista_id?: string,
        @Query('rutero_logistico_id') rutero_logistico_id?: string,
        @Query('pedido_id') pedido_id?: string,
        @Query('estado') estado?: string,
        @Query('fecha') fecha?: string,
    ) {
        return this.deliveriesService.findAll({
            transportista_id,
            rutero_logistico_id,
            pedido_id,
            estado,
            fecha,
        });
    }

    @Get(':id')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR, RolUsuario.TRANSPORTISTA)
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.deliveriesService.findOne(id);
    }

    @Get(':id/historial')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR, RolUsuario.TRANSPORTISTA)
    findHistory(@Param('id', ParseUUIDPipe) id: string) {
        return this.deliveriesService.findHistory(id);
    }

    @Put(':id/en-ruta')
    @Roles(RolUsuario.TRANSPORTISTA)
    markEnRuta(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user?: AuthUser,
    ) {
        return this.deliveriesService.markEnRuta(id, user?.userId);
    }

    @Post(':id/completar')
    @Roles(RolUsuario.TRANSPORTISTA)
    completeDelivery(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: CompleteDeliveryDto,
        @CurrentUser() user?: AuthUser,
    ) {
        return this.deliveriesService.completeDelivery(id, dto, user?.userId);
    }

    @Post(':id/completar-parcial')
    @Roles(RolUsuario.TRANSPORTISTA)
    completePartialDelivery(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: CompletePartialDeliveryDto,
        @CurrentUser() user?: AuthUser,
    ) {
        return this.deliveriesService.completePartialDelivery(id, dto, user?.userId);
    }

    @Post(':id/no-entregado')
    @Roles(RolUsuario.TRANSPORTISTA)
    markNoDelivery(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: NoDeliveryDto,
        @CurrentUser() user?: AuthUser,
    ) {
        return this.deliveriesService.markNoDelivery(id, dto, user?.userId);
    }

    @Post(':id/evidencias')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR, RolUsuario.TRANSPORTISTA)
    addEvidence(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() evidence: EvidenceInputDto,
        @CurrentUser() user?: AuthUser,
    ) {
        return this.deliveriesService.addEvidence(id, evidence, user?.userId);
    }

    @Put(':id/cancelar')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    cancel(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: CancelDeliveryDto,
        @CurrentUser() user?: AuthUser,
    ) {
        return this.deliveriesService.cancelDelivery(id, dto, user?.userId);
    }

    @Post(':id/incidencias')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR, RolUsuario.TRANSPORTISTA)
    reportIncident(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: ReportIncidentDto,
        @CurrentUser() user?: AuthUser,
    ) {
        return this.incidentsService.reportIncident(id, dto, user?.userId);
    }
}

import {
    Controller,
    Get,
    Put,
    Delete,
    Param,
    ParseUUIDPipe,
    Body,
    UseGuards,
    Query,
} from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { ResolveIncidentDto } from './dto/resolve-incident.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolUsuario } from '../common/constants/rol-usuario.enum';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('incidencias')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IncidentsController {
    constructor(private readonly incidentsService: IncidentsService) { }

    @Get()
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    findAll(@Query('resuelto') resuelto?: string, @Query('severidad') severidad?: string) {
        if (resuelto === 'false') {
            const severidades = severidad ? severidad.split(',').map((s) => s.trim()).filter(Boolean) : undefined;
            return this.incidentsService.findUnresolved(severidades);
        }
        return this.incidentsService.findAll();
    }

    @Get(':id')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.incidentsService.findOne(id);
    }

    @Put(':id/resolver')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    resolveIncident(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() resolveDto: ResolveIncidentDto,
        @CurrentUser() user?: AuthUser,
    ) {
        return this.incidentsService.resolveIncident(id, resolveDto, user?.userId);
    }

    @Delete(':id')
    @Roles(RolUsuario.ADMIN)
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.incidentsService.remove(id);
    }
}

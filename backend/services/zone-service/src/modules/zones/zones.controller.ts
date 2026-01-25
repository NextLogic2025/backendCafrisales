import { Controller, Get, Post, Body, Param, UseGuards, Patch, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ZonesService } from './zones.service';
import { SchedulesService } from '../schedules/schedules.service';
import { CoverageService } from '../coverage/coverage.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { Zone } from './entities/zone.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolUsuario } from '../../common/enums/rol-usuario.enum';

@ApiTags('Zones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('zones')
export class ZonesController {
    constructor(
        private readonly zonesService: ZonesService,
        private readonly schedulesService: SchedulesService,
        private readonly coverageService: CoverageService
    ) { }

    @Post()
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    create(@Body() createZoneDto: CreateZoneDto): Promise<Zone> {
        return this.zonesService.create(createZoneDto);
    }

    @Get()
    findAll(): Promise<Zone[]> {
        return this.zonesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string): Promise<Zone> {
        return this.zonesService.findOne(id);
    }

    @Patch(':id')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    update(@Param('id') id: string, @Body() updateData: Partial<CreateZoneDto>): Promise<Zone> {
        // Implement update logic in service, for now mapped to create partial
        // Ideally CreateZoneDto should be UpdateZoneDto or Partial
        return this.zonesService.update(id, updateData);
    }

    @Get(':id/horarios')
    getSchedules(@Param('id') id: string) {
        return this.schedulesService.findByZone(id);
    }

    @Put(':id/horarios')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    updateSchedules(@Param('id') id: string, @Body() schedules: any[]) {
        return this.schedulesService.updateForZone(id, schedules);
    }

    @Put(':id/geometria')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    updateGeometry(@Param('id') id: string, @Body() body: { geometry: object }) {
        return this.zonesService.updateGeometry(id, body.geometry);
    }

    @Post('resolver')
    async resolveZone(@Body() body: { lat: number; lon: number }) {
        const zone = await this.coverageService.findZoneByPoint(body.lat, body.lon);
        return zone;
    }
}

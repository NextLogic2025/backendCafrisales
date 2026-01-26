import { Controller, Get, Post, Body, Param, UseGuards, Patch, Put, Query, Req } from '@nestjs/common';
import { Request } from 'express';
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
@Controller('zonas')
export class ZonesController {
    constructor(
        private readonly zonesService: ZonesService,
        private readonly schedulesService: SchedulesService,
        private readonly coverageService: CoverageService
    ) { }

    @Post()
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    create(@Body() createZoneDto: CreateZoneDto, @Req() req: Request): Promise<Zone> {
        const userId = (req.user as any)?.userId;
        return this.zonesService.create(createZoneDto, userId);
    }

    @Get()
    findAll(@Query('estado') estado?: string, @Query('activo') activo?: string): Promise<Zone[]> {
        return this.zonesService.findAll(estado, activo);
    }

    @Get('disponibles-entregas')
    disponiblesEntregas(@Query('dia_semana') dia: string) {
        return this.schedulesService.getZonesByScheduleDay(Number(dia), 'entregas');
    }

    @Get('disponibles-visitas')
    disponiblesVisitas(@Query('dia_semana') dia: string) {
        return this.schedulesService.getZonesByScheduleDay(Number(dia), 'visitas');
    }

    @Post('resolver')
    async resolveZone(@Body() body: { lat: number; lon: number }) {
        const zone = await this.coverageService.findZoneByPoint(body.lat, body.lon);
        return zone;
    }

    @Get(':id')
    findOne(@Param('id') id: string): Promise<Zone> {
        return this.zonesService.findOne(id);
    }

    @Patch(':id')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    update(@Param('id') id: string, @Body() updateData: Partial<CreateZoneDto>, @Req() req: Request): Promise<Zone> {
        const userId = (req.user as any)?.userId;
        return this.zonesService.update(id, updateData, userId);
    }

    @Put(':id')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    updatePut(@Param('id') id: string, @Body() updateData: Partial<CreateZoneDto>, @Req() req: Request): Promise<Zone> {
        const userId = (req.user as any)?.userId;
        return this.zonesService.update(id, updateData, userId);
    }

    @Put(':id/desactivar')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    deactivate(@Param('id') id: string, @Req() req: Request) {
        const userId = (req.user as any)?.userId;
        return this.zonesService.deactivate(id, userId);
    }

    @Get(':id/horarios')
    getSchedules(@Param('id') id: string) {
        return this.schedulesService.findByZone(id);
    }

    @Put(':id/horarios')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    updateSchedules(@Param('id') id: string, @Body() schedules: any[], @Req() req: Request) {
        const userId = (req.user as any)?.userId;
        return this.schedulesService.replaceForZone(id, schedules, userId);
    }

    @Put(':id/horarios/:dia')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    upsertSchedule(@Param('id') id: string, @Param('dia') dia: string, @Body() body: any, @Req() req: Request) {
        const userId = (req.user as any)?.userId;
        return this.schedulesService.upsertForZoneDay(id, Number(dia), body, userId);
    }

    @Get(':id/disponibilidad-entrega')
    disponibilidadEntrega(@Param('id') id: string, @Query('fecha') fecha: string) {
        return this.schedulesService.getAvailabilityForDate(id, fecha, 'entregas');
    }

    @Get(':id/disponibilidad-visita')
    disponibilidadVisita(@Param('id') id: string, @Query('fecha') fecha: string) {
        return this.schedulesService.getAvailabilityForDate(id, fecha, 'visitas');
    }

    @Put(':id/geometria')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    updateGeometry(@Param('id') id: string, @Body() body: { geometry: object }, @Req() req: Request) {
        const userId = (req.user as any)?.userId;
        return this.zonesService.updateGeometry(id, body.geometry, userId);
    }
}
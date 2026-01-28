import { Controller, Get, Post, Body, Param, UseGuards, Patch, Put, Query, ParseUUIDPipe, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ZonesService } from './zones.service';
import { SchedulesService } from '../schedules/schedules.service';
import { CoverageService } from '../coverage/coverage.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { CheckPointDto } from '../coverage/dto/check-point.dto';
import { Zone } from './entities/zone.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolUsuario } from '../../common/enums/rol-usuario.enum';
import { GetUser, AuthUser } from '../../common/decorators/get-user.decorator';

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
    create(@Body() createZoneDto: CreateZoneDto, @GetUser() user: AuthUser): Promise<Zone> {
        return this.zonesService.create(createZoneDto, user?.userId);
    }

    @Get()
    findAll(@Query('estado') estado?: string, @Query('activo') activo?: string): Promise<Zone[]> {
        return this.zonesService.findAll(estado, activo);
    }

    @Get('disponibles-entregas')
    disponiblesEntregas(@Query('dia_semana', ParseIntPipe) dia: number) {
        return this.schedulesService.getZonesByScheduleDay(dia, 'entregas');
    }

    @Get('disponibles-visitas')
    disponiblesVisitas(@Query('dia_semana', ParseIntPipe) dia: number) {
        return this.schedulesService.getZonesByScheduleDay(dia, 'visitas');
    }

    @Post('resolver')
    async resolveZone(@Body() body: CheckPointDto) {
        const zone = await this.coverageService.findZoneByPoint(body.lat, body.lon);
        return zone;
    }

    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Zone> {
        return this.zonesService.findOne(id);
    }

    @Patch(':id')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateData: Partial<CreateZoneDto>,
        @GetUser() user: AuthUser,
    ): Promise<Zone> {
        return this.zonesService.update(id, updateData, user?.userId);
    }

    @Put(':id')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    updatePut(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateData: Partial<CreateZoneDto>,
        @GetUser() user: AuthUser,
    ): Promise<Zone> {
        return this.zonesService.update(id, updateData, user?.userId);
    }

    @Put(':id/desactivar')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    deactivate(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: AuthUser) {
        return this.zonesService.deactivate(id, user?.userId);
    }

    @Get(':id/horarios')
    getSchedules(@Param('id', ParseUUIDPipe) id: string) {
        return this.schedulesService.findByZone(id);
    }

    @Put(':id/horarios')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    updateSchedules(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() schedules: any[],
        @GetUser() user: AuthUser,
    ) {
        return this.schedulesService.replaceForZone(id, schedules, user?.userId);
    }

    @Put(':id/horarios/:dia')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    upsertSchedule(
        @Param('id', ParseUUIDPipe) id: string,
        @Param('dia', ParseIntPipe) dia: number,
        @Body() body: any,
        @GetUser() user: AuthUser,
    ) {
        return this.schedulesService.upsertForZoneDay(id, dia, body, user?.userId);
    }

    @Get(':id/disponibilidad-entrega')
    disponibilidadEntrega(@Param('id', ParseUUIDPipe) id: string, @Query('fecha') fecha: string) {
        return this.schedulesService.getAvailabilityForDate(id, fecha, 'entregas');
    }

    @Get(':id/disponibilidad-visita')
    disponibilidadVisita(@Param('id', ParseUUIDPipe) id: string, @Query('fecha') fecha: string) {
        return this.schedulesService.getAvailabilityForDate(id, fecha, 'visitas');
    }

    @Put(':id/geometria')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    updateGeometry(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() body: { geometry: object },
        @GetUser() user: AuthUser,
    ) {
        return this.zonesService.updateGeometry(id, body.geometry, user?.userId);
    }
}
import { Controller, Get, Post, Body, Param, UseGuards, Patch, Put, Query, ParseUUIDPipe, ParseIntPipe, Header, HttpCode, HttpStatus, Delete, ClassSerializerInterceptor, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
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
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { ZoneFilterDto } from './dto/zone-filter.dto';

@ApiTags('Zones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'zones', version: '1' })
@UseInterceptors(ClassSerializerInterceptor)
export class ZonesController {
    constructor(
        private readonly zonesService: ZonesService,
        private readonly schedulesService: SchedulesService,
        private readonly coverageService: CoverageService
    ) { }

    @Post()
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Crear zona' })
    create(@Body() createZoneDto: CreateZoneDto, @GetUser() user: AuthUser): Promise<Zone> {
        return this.zonesService.create(createZoneDto, user?.userId);
    }

    @Get()
    @Header('Cache-Control', 'public, max-age=60')
    @ApiOperation({ summary: 'Listar zonas con paginación' })
    async findAll(
        @Query() pagination: PaginationQueryDto,
        @Query() filters: ZoneFilterDto,
    ) {
        const { data, meta } = await this.zonesService.findAllPaginated(pagination, filters);
        return { data, meta };
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
    @Header('Cache-Control', 'public, max-age=60')
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

    @Delete(':id')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    @HttpCode(HttpStatus.NO_CONTENT)
    delete(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: AuthUser) {
        return this.zonesService.softDelete(id, user?.userId);
    }

    @Get(':id/stats')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    getStats(@Param('id', ParseUUIDPipe) id: string) {
        return this.zonesService.getStats(id);
    }

    @Get(':id/users')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    getAssignedUsers(@Param('id', ParseUUIDPipe) id: string) {
        // Mock response until User Service integration
        return { message: 'Not Implemented - Check User Service', data: [] };
    }

    @Post(':id/users')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    assignUser(@Param('id', ParseUUIDPipe) id: string, @Body() body: { userId: string }) {
        return { message: 'Not Implemented - Check User Service' };
    }

    @Delete(':id/users/:userId')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    unassignUser(@Param('id', ParseUUIDPipe) id: string, @Param('userId') userId: string) {
        return { message: 'Not Implemented - Check User Service' };
    }

    @Post('validate-point')
    @HttpCode(HttpStatus.OK)
    async validatePoint(@Body() body: CheckPointDto) {
        const zone = await this.coverageService.findZoneByPoint(body.lat, body.lon);
        return zone;
    }


    /* ... Keep existing Schedule endpoints ... */

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
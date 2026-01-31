import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Query, UseGuards, Put, UseInterceptors, ClassSerializerInterceptor, BadRequestException, Headers, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
// import { UpdateUserDto } from './dto/update-user.dto'; // Removed as it doesn't exist
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UserFilterDto } from './dto/user-filter.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { PaginatedResponse, createPaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RolUsuario } from '../../common/enums/rol-usuario.enum';
import { GetUser as CurrentUser, AuthUser, GetUser } from '../../common/decorators/get-user.decorator'; // Aliasing GetUser as CurrentUser for consistency if code uses it
import { CreateStaffUserDto } from './dto/create-staff-user.dto';
import { SuspendUserDto } from './dto/suspend-user.dto';
import { AuthExternalService } from '../../services/auth-external.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller({ path: 'users', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authExternalService: AuthExternalService,
  ) { }

  @Get('me')
  @ApiOperation({ summary: 'Obtener mi perfil' })
  async getProfile(@CurrentUser() user: AuthUser) {
    return this.usersService.findById(user.userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Actualizar mi perfil' })
  async updateProfile(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.usersService.update(user.userId, { ...body, actualizado_por: user.userId });
  }

  /*
  @Patch('me/password')
  @ApiOperation({ summary: 'Cambiar mi contraseña' })
  async updateMyPassword(@CurrentUser() user: AuthUser, @Body() dto: UpdatePasswordDto) {
      return this.usersService.updatePassword(user.userId, dto);
  }
  */

  @Get()
  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF, RolUsuario.SUPERVISOR)
  @ApiOperation({ summary: 'Listar usuarios paginados' })
  async findAll(
    @Query() pagination: PaginationQueryDto,
    @Query() filters: UserFilterDto,
  ) {
    const { data, meta } = await this.usersService.findAllPaginated(pagination, filters);
    return { data, meta };
  }

  @Post('vendedor')
  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF, RolUsuario.SUPERVISOR)
  // ... keep legacy create
  async createVendedor(
    @Body() body: CreateStaffUserDto,
    @Headers('authorization') authHeader: string,
    @GetUser() user: AuthUser,
  ) {
    return this.createStaffUser('vendedor', body, authHeader, user);
  }

  @Post('bodeguero')
  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF, RolUsuario.SUPERVISOR)
  async createBodeguero(
    @Body() body: CreateStaffUserDto,
    @Headers('authorization') authHeader: string,
    @GetUser() user: AuthUser,
  ) {
    return this.createStaffUser('bodeguero', body, authHeader, user);
  }

  @Post('transportista')
  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF, RolUsuario.SUPERVISOR)
  async createTransportista(
    @Body() body: CreateStaffUserDto,
    @Headers('authorization') authHeader: string,
    @GetUser() user: AuthUser,
  ) {
    return this.createStaffUser('transportista', body, authHeader, user);
  }

  @Post('supervisor')
  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF)
  async createSupervisor(
    @Body() body: CreateStaffUserDto,
    @Headers('authorization') authHeader: string,
    @GetUser() user: AuthUser,
  ) {
    return this.createStaffUser('supervisor', body, authHeader, user);
  }

  // Deprecated/Legacy
  @Get('by-role/:role')
  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF, RolUsuario.SUPERVISOR)
  async getUsersByRole(@Param('role') role: string) {
    return this.usersService.findByRole(role as RolUsuario);
  }

  @Get(':id')
  @Roles(
    RolUsuario.ADMIN, RolUsuario.STAFF, RolUsuario.SUPERVISOR,
    RolUsuario.VENDEDOR, RolUsuario.BODEGUERO, RolUsuario.TRANSPORTISTA, RolUsuario.CLIENTE,
  )
  async get(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF, RolUsuario.SUPERVISOR)
  async patch(@Param('id', ParseUUIDPipe) id: string, @Body() body: any, @GetUser() user: AuthUser) {
    return this.usersService.update(id, { ...body, actualizado_por: user.userId });
  }

  @Post(':id/activate')
  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF, RolUsuario.SUPERVISOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activar usuario' })
  async activate(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.usersService.activate(id, user.userId);
  }

  @Post(':id/deactivate')
  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF, RolUsuario.SUPERVISOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desactivar usuario' })
  async deactivate(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.usersService.deactivate(id, user.userId);
  }

  @Post(':id/suspend')
  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF, RolUsuario.SUPERVISOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspender usuario' })
  async suspend(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: SuspendUserDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.usersService.suspend(id, user.userId, body?.motivo);
  }

  @Delete(':id')
  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar usuario (soft)' })
  async delete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.usersService.softDelete(id, user.userId);
  }

  // Old suspend endpoint removed or mapped to new one

  private async createStaffUser(
    rol: 'vendedor' | 'bodeguero' | 'transportista' | 'supervisor',
    body: CreateStaffUserDto,
    authHeader: string,
    user: AuthUser,
  ) {
    const actorId = user.userId;
    const codigoEmpleado = body.codigo_empleado?.trim();

    if (!codigoEmpleado) {
      throw new BadRequestException('codigo_empleado requerido');
    }

    if (rol === 'transportista' && !body.numero_licencia?.trim()) {
      throw new BadRequestException('numero_licencia requerido');
    }

    const perfil = {
      nombres: body.nombres,
      apellidos: body.apellidos,
      telefono: body.telefono || undefined,
    };

    const payload: any = {
      email: body.email,
      password: body.password,
      rol,
      perfil,
      creado_por: actorId,
    };

    if (rol === 'vendedor') {
      payload.vendedor = {
        codigo_empleado: codigoEmpleado,
        supervisor_id: body.supervisor_id || actorId || null,
      };
    }

    if (rol === 'bodeguero') {
      payload.bodeguero = { codigo_empleado: codigoEmpleado };
    }

    if (rol === 'transportista') {
      payload.transportista = {
        codigo_empleado: codigoEmpleado,
        numero_licencia: body.numero_licencia,
        licencia_vence_en: body.licencia_vence_en || null,
      };
    }

    if (rol === 'supervisor') {
      payload.supervisor = { codigo_empleado: codigoEmpleado };
    }

    const authResponse = await this.authExternalService.registerUser(payload, authHeader);
    const userId = authResponse?.id || authResponse?.usuario_id || authResponse?.userId;
    if (!userId) {
      throw new BadRequestException('No se pudo obtener el id del usuario');
    }

    try {
      return await this.usersService.create({
        id: userId,
        email: body.email,
        rol: rol as any,
        creado_por: actorId || undefined,
        perfil,
        vendedor: payload.vendedor,
        bodeguero: payload.bodeguero,
        transportista: payload.transportista,
        supervisor: payload.supervisor,
      } as any);
    } catch (err: any) {
      if (err && err.code === '23505') {
        const existing = await this.usersService.findById(userId);
        if (existing) return existing;
      }
      throw err;
    }
  }
}

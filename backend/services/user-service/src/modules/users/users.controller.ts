import { Body, Controller, Get, Param, Patch, Post, Put, UseGuards, BadRequestException, Headers, ParseUUIDPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RolUsuario } from '../../common/enums/rol-usuario.enum';
import { GetUser, AuthUser } from '../../common/decorators/get-user.decorator';
import { CreateStaffUserDto } from './dto/create-staff-user.dto';
import { SuspendUserDto } from './dto/suspend-user.dto';
import { AuthExternalService } from '../../services/auth-external.service';

@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authExternalService: AuthExternalService,
  ) {}

  @Post('vendedor')
  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF, RolUsuario.SUPERVISOR)
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

  @Get(':id')
  @Roles(
    RolUsuario.ADMIN,
    RolUsuario.STAFF,
    RolUsuario.SUPERVISOR,
    RolUsuario.VENDEDOR,
    RolUsuario.BODEGUERO,
    RolUsuario.TRANSPORTISTA,
    RolUsuario.CLIENTE,
  )
  async get(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF, RolUsuario.SUPERVISOR)
  async patch(@Param('id', ParseUUIDPipe) id: string, @Body() body: any, @GetUser() user: AuthUser) {
    return this.usersService.update(id, { ...body, actualizado_por: user.userId });
  }

  @Put(':id/suspender')
  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF, RolUsuario.SUPERVISOR)
  async suspend(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: SuspendUserDto,
    @GetUser() user: AuthUser,
  ) {
    return this.usersService.suspend(id, user.userId, body?.motivo);
  }

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

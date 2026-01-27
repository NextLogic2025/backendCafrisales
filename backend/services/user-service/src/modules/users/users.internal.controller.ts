import { Controller, Post, Body, UseGuards, Logger, Req, ConflictException, Get, Param, ForbiddenException, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('internal/usuarios')
@UseGuards(RolesGuard)
export class UsersInternalController {
  private readonly logger = new Logger(UsersInternalController.name);
  constructor(private readonly usersService: UsersService) { }

  @Get(':id')
  async getById(@Param('id') id: string, @Req() req: any) {
    this.assertServiceToken(req);
    // Expuesto para llamadas S2S usando SERVICE_TOKEN; sin JWT.
    return this.usersService.findById(id);
  }

  @Post('sync')
  async syncUser(@Body() body: any, @Req() req: any) {
    this.assertServiceToken(req);
    const dto = this.normalizePayload(body);
    // idempotency: if exists, return quickly
    const exists = await this.usersService.findById((dto as any).id);
    if (exists) return;

    try {
      await this.usersService.create(dto as any);
      return;
    } catch (err: any) {
      // map DB unique violations to 409 for outbox processor handling
      if (err && err.code === '23505') {
        if (err.detail && err.detail.includes('codigo_empleado')) {
          throw new BadRequestException('El código de empleado ya está en uso.');
        }
        throw new ConflictException('Resource conflict in user-service');
      }
      if (err && err.code === '23503') {
        let message = `Foreign key violation: ${err.detail}`;
        if (err.constraint === 'clientes_canal_id_fkey') {
          message = 'El canal comercial especificado no es válido o no existe.';
        } else if (err.constraint === 'clientes_zona_id_fkey') {
          message = 'La zona especificada no es válida o no existe.';
        } else if (err.constraint === 'clientes_vendedor_asignado_id_fkey') {
          message = 'El vendedor asignado no es válido.';
        }
        throw new BadRequestException(message);
      }
      throw err;
    }
  }

  private assertServiceToken(req: any) {
    const svcToken = req.headers['x-service-token'] || req.headers['service-token'];
    if (!svcToken || svcToken !== process.env.SERVICE_TOKEN) {
      throw new ForbiddenException('Servicio no autorizado');
    }
  }

  private normalizePayload(body: any): CreateUserDto {
    if (!body?.email) {
      throw new BadRequestException('Email requerido para sincronizar usuario');
    }

    const id = body.id || body.usuario_id;
    if (!id) {
      throw new BadRequestException('usuario_id requerido para sincronizar usuario');
    }

    const rol = (body.rol || 'cliente').toLowerCase();
    const dto: any = {
      ...body,
      id,
      rol,
    };

    return dto as CreateUserDto;
  }
}

import { Controller, Get, Put, Body, NotFoundException, UseGuards, Param, ParseUUIDPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolUsuario } from '../../common/enums/rol-usuario.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Perfil } from './entities/perfil.entity';
import { Repository } from 'typeorm';
import { GetUser, AuthUser } from '../../common/decorators/get-user.decorator';
import { ZoneExternalService } from '../../services/zone-external.service';

@Controller('usuarios')
export class ProfilesController {
  constructor(
    @InjectRepository(Perfil)
    private readonly perfilRepo: Repository<Perfil>,
    private readonly zoneExternalService: ZoneExternalService,
  ) { }

  @UseGuards(JwtAuthGuard)
  @Get('me/perfil')
  async getMyProfile(@GetUser() user: AuthUser) {
    const userId = user.userId;

    const p = await this.perfilRepo.findOneBy({ usuario_id: userId } as any);
    if (!p) throw new NotFoundException('Perfil no encontrado');

    let zona = null;
    if ((p as any).zona_id) {
      zona = await this.zoneExternalService.getZoneById((p as any).zona_id);
    }

    return {
      ...p,
      zona,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put('me/perfil')
  async upsertMyProfile(@Body() body: Partial<Perfil>, @GetUser() user: AuthUser) {
    const userId = user.userId;

    const allowedPayload: Partial<Perfil> = {};
    if (typeof body.nombres === 'string') allowedPayload.nombres = body.nombres.trim();
    if (typeof body.apellidos === 'string') allowedPayload.apellidos = body.apellidos.trim();
    if (typeof body.telefono === 'string' || body.telefono === null) allowedPayload.telefono = body.telefono?.trim() as any;
    if (typeof body.url_avatar === 'string' || body.url_avatar === null) allowedPayload.url_avatar = body.url_avatar as any;
    if (body.preferencias !== undefined) allowedPayload.preferencias = body.preferencias as any;

    const exists = await this.perfilRepo.findOneBy({ usuario_id: userId } as any);
    if (exists) {
      await this.perfilRepo.update(
        { usuario_id: userId } as any,
        {
          ...allowedPayload,
          actualizado_en: new Date(),
          actualizado_por: userId,
          version: (exists as any).version ? (exists as any).version + 1 : 2,
        } as any,
      );
      return this.perfilRepo.findOneBy({ usuario_id: userId } as any);
    }
    const entity = this.perfilRepo.create({
      usuario_id: userId,
      ...allowedPayload,
      actualizado_por: userId,
    } as any);
    return this.perfilRepo.save(entity);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id/perfil')
  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF, RolUsuario.SUPERVISOR)
  async getProfileByUser(@Param('id', ParseUUIDPipe) id: string) {
    const perfil = await this.perfilRepo.findOneBy({ usuario_id: id } as any);
    if (!perfil) throw new NotFoundException('Perfil no encontrado');
    return perfil;
  }
}

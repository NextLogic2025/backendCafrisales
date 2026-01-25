import { Controller, Get, Put, Body, NotFoundException, UseGuards, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Perfil } from './entities/perfil.entity';
import { Repository } from 'typeorm';
import { GetUser } from '../../common/decorators';
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
  async getMyProfile(@GetUser() user: any) {
    const userId = user?.userId;
    if (!userId) throw new ForbiddenException();

    const p = await this.perfilRepo.findOneBy({ usuario_id: userId } as any);
    if (!p) throw new NotFoundException();

    // Fetch zone information if zona_id exists
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
  async upsertMyProfile(@Body() body: Partial<Perfil>, @GetUser() user: any) {
    const userId = user?.userId;
    if (!userId) throw new ForbiddenException();

    const exists = await this.perfilRepo.findOneBy({ usuario_id: userId } as any);
    if (exists) {
      await this.perfilRepo.update({ usuario_id: userId } as any, body as any);
      return this.perfilRepo.findOneBy({ usuario_id: userId } as any);
    }
    const entity = this.perfilRepo.create({ usuario_id: userId, ...body } as any);
    return this.perfilRepo.save(entity);
  }
}

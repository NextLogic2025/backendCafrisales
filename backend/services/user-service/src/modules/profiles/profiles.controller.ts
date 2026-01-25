import { Controller, Get, Param, Put, Body, NotFoundException, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Perfil } from './entities/perfil.entity';
import { Repository } from 'typeorm';

@Controller('usuarios')
export class ProfilesController {
  constructor(
    @InjectRepository(Perfil)
    private readonly perfilRepo: Repository<Perfil>,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get(':id/perfil')
  async getProfile(@Param('id') id: string) {
    const p = await this.perfilRepo.findOneBy({ usuario_id: id } as any);
    if (!p) throw new NotFoundException();
    return p;
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/perfil')
  async upsertProfile(@Param('id') id: string, @Body() body: Partial<Perfil>) {
    const exists = await this.perfilRepo.findOneBy({ usuario_id: id } as any);
    if (exists) {
      await this.perfilRepo.update({ usuario_id: id } as any, body as any);
      return this.perfilRepo.findOneBy({ usuario_id: id } as any);
    }
    const entity = this.perfilRepo.create({ usuario_id: id, ...body } as any);
    return this.perfilRepo.save(entity);
  }
}

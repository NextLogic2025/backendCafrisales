import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CanalComercial } from './entities/canal-comercial.entity';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@Injectable()
export class ChannelsService {
  constructor(
    @InjectRepository(CanalComercial)
    private readonly repo: Repository<CanalComercial>,
  ) {}

  async create(dto: CreateChannelDto) {
    const existing = await this.repo.findOneBy({ codigo: dto.codigo } as any);
    if (existing) {
      throw new ConflictException(`El codigo '${dto.codigo}' ya existe`);
    }
    const e = this.repo.create(dto as any);
    return this.repo.save(e);
  }

  async findAll() {
    return this.repo.find({ where: { activo: true }, order: { nombre: 'ASC' } });
  }

  async findOne(id: string) {
    const r = await this.repo.findOneBy({ id } as any);
    if (!r) throw new NotFoundException('Canal no encontrado');
    return r;
  }

  async update(id: string, dto: UpdateChannelDto) {
    const existing = await this.repo.findOneBy({ id } as any);
    if (!existing) throw new NotFoundException('Canal no encontrado');

    if (dto.codigo && dto.codigo !== existing.codigo) {
      const conflict = await this.repo.findOneBy({ codigo: dto.codigo } as any);
      if (conflict) throw new ConflictException(`El codigo '${dto.codigo}' ya existe`);
    }

    await this.repo.update({ id } as any, dto as any);
    return this.findOne(id);
  }

  async deactivate(id: string) {
    const existed = await this.repo.findOneBy({ id, activo: true } as any);
    if (!existed) throw new NotFoundException('Canal no encontrado o ya desactivado');
    await this.repo.update({ id } as any, { activo: false });
    return this.repo.findOneBy({ id } as any);
  }
}

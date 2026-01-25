import { Injectable, NotFoundException } from '@nestjs/common';
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
    const e = this.repo.create(dto as any);
    return this.repo.save(e);
  }

  async findAll() {
    return this.repo.find({ order: { nombre: 'ASC' } });
  }

  async findOne(id: string) {
    const r = await this.repo.findOneBy({ id } as any);
    if (!r) throw new NotFoundException();
    return r;
  }

  async update(id: string, dto: UpdateChannelDto) {
    await this.repo.update({ id } as any, dto as any);
    return this.findOne(id);
  }

  async remove(id: string) {
    const existed = await this.repo.findOneBy({ id } as any);
    if (!existed) throw new NotFoundException();
    await this.repo.delete({ id } as any);
    return { deleted: true };
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sku } from './entities/sku.entity';

@Injectable()
export class SkusService {
  constructor(@InjectRepository(Sku) private repo: Repository<Sku>) { }

  create(dto: Partial<Sku>) {
    const s = this.repo.create(dto as any);
    return this.repo.save(s);
  }

  findAll() {
    return this.repo.find({
      relations: ['producto'],
    });
  }

  findAllComplete() {
    return this.repo.find({
      relations: ['producto', 'producto.categoria', 'precios'],
    });
  }

  findOne(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: ['producto'],
    });
  }

  async update(id: string, dto: Partial<Sku>) {
    await this.repo.update(id, dto as any);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.repo.delete(id);
    return { deleted: true };
  }
}

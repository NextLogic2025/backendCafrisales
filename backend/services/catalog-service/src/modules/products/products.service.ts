import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(@InjectRepository(Product) private repo: Repository<Product>) {}

  create(dto: Partial<Product>) {
    const p = this.repo.create(dto as any);
    return this.repo.save(p);
  }

  findAll() {
    return this.repo.find({ relations: ['categoria'] });
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id }, relations: ['categoria'] });
  }

  async update(id: string, dto: Partial<Product>) {
    await this.repo.update(id, dto as any);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.repo.delete(id);
    return { deleted: true };
  }
}

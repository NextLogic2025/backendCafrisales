import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { slugify, ensureUniqueSlug } from '../../common/utils/slug.utils';

@Injectable()
export class CategoriesService {
  constructor(@InjectRepository(Category) private repo: Repository<Category>) { }

  async create(dto: Partial<Category>) {
    // Auto-generate slug if not provided
    const baseSlug = dto.slug || slugify(dto.nombre || '');
    const uniqueSlug = await ensureUniqueSlug(baseSlug, async (slug) => {
      const existing = await this.repo.findOne({ where: { slug } });
      return existing !== null;
    });

    const c = this.repo.create({ ...dto, slug: uniqueSlug } as any);
    return this.repo.save(c);
  }

  findAll() {
    return this.repo.find();
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async update(id: string, dto: Partial<Category>) {
    await this.repo.update(id, dto as any);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.repo.delete(id);
    return { deleted: true };
  }
}

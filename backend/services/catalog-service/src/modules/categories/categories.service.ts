import { Injectable, ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { slugify, ensureUniqueSlug } from '../../common/utils/slug.utils';

@Injectable()
export class CategoriesService {
  constructor(@InjectRepository(Category) private repo: Repository<Category>) { }

  async create(dto: Partial<Category>, actorId?: string) {
    // Auto-generate slug if not provided
    const baseSlug = dto.slug || slugify(dto.nombre || '');
    const uniqueSlug = await ensureUniqueSlug(baseSlug, async (slug) => {
      const existing = await this.repo.findOne({ where: { slug } });
      return existing !== null;
    });

    const c = this.repo.create({
      ...dto,
      slug: uniqueSlug,
      orden: dto.orden ?? 0,
      activo: dto.activo ?? true,
      creado_por: actorId,
      actualizado_por: actorId,
    } as any);
    return this.repo.save(c);
  }

  findAll() {
    return this.repo.find({
      order: { orden: 'ASC', nombre: 'ASC' },
    });
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async update(id: string, dto: Partial<Category>, actorId?: string) {
    if (dto.slug) {
      const existing = await this.repo.findOne({ where: { slug: dto.slug } });
      if (existing && existing.id !== id) {
        throw new ConflictException('El slug ya esta registrado');
      }
    }

    await this.repo.update(id, {
      ...dto,
      actualizado_por: actorId,
    } as any);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.repo.delete(id);
    return { deleted: true };
  }
}

import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { slugify, ensureUniqueSlug } from '../../common/utils/slug.utils';
import { StorageProvider } from '../../common/providers/storage.provider';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category) private repo: Repository<Category>,
    private readonly storageProvider: StorageProvider,
  ) { }

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
      where: { activo: true },
      order: { orden: 'ASC', nombre: 'ASC' },
    });
  }

  async findOne(id: string) {
    const category = await this.repo.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Categoria con ID ${id} no encontrada`);
    }
    return category;
  }

  async update(id: string, dto: Partial<Category>, actorId?: string) {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Categoria con ID ${id} no encontrada`);
    }

    if (dto.slug && dto.slug !== existing.slug) {
      const conflict = await this.repo.findOne({ where: { slug: dto.slug } });
      if (conflict) {
        throw new ConflictException('El slug ya esta registrado');
      }
    }

    await this.repo.update(id, {
      ...dto,
      actualizado_por: actorId,
    } as any);
    return this.findOne(id);
  }

  async deactivate(id: string, actorId?: string) {
    const category = await this.repo.findOne({ where: { id, activo: true } });
    if (!category) {
      throw new NotFoundException('Categoria no encontrada o ya desactivada');
    }

    await this.repo.update(id, { activo: false, actualizado_por: actorId } as any);
    return this.repo.findOne({ where: { id } });
  }

  async uploadImage(id: string, file: Express.Multer.File, actorId: string) {
    const category = await this.findOne(id);

    // Delete old image if exists
    if (category.img_url) {
      await this.storageProvider.deleteFile(category.img_url);
    }

    // Upload new image
    const url = await this.storageProvider.uploadFile(file, 'categories');

    await this.repo.update(id, {
      img_url: url,
      actualizado_por: actorId,
    } as any);

    return this.findOne(id);
  }
}

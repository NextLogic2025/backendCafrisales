import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateCompleteProductDto } from './dto/create-complete-product.dto';
import { Category } from '../categories/entities/category.entity';
import { Sku } from '../skus/entities/sku.entity';
import { PrecioSku } from '../prices/entities/precio-sku.entity';
import { slugify, ensureUniqueSlug } from '../../common/utils/slug.utils';
import { OutboxService } from '../outbox/outbox.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private repo: Repository<Product>,
    @InjectRepository(Category) private categoriesRepo: Repository<Category>,
    private dataSource: DataSource,
    private outbox: OutboxService,
  ) {}

  /**
   * Creates a complete sellable product in a single transaction:
   * Category (if needed) -> Product -> SKU -> Price
   */
  async createComplete(dto: CreateCompleteProductDto, actorId?: string) {
    const result = await this.dataSource.transaction(async (manager) => {
      let categoryId = dto.categoria_id;

      // Step 1: Validate or create category
      if (!categoryId) {
        if (!dto.categoria_nombre) {
          throw new BadRequestException(
            'Debe proporcionar categoria_id o categoria_nombre',
          );
        }

        const categorySlug = dto.categoria_slug || slugify(dto.categoria_nombre);
        const existingCategory = await manager.findOne(Category, {
          where: { slug: categorySlug },
        });

        if (existingCategory) {
          categoryId = existingCategory.id;
        } else {
          const uniqueCategorySlug = await ensureUniqueSlug(
            categorySlug,
            async (slug) => {
              const cat = await manager.findOne(Category, { where: { slug } });
              return cat !== null;
            },
          );

          const newCategory = manager.create(Category, {
            nombre: dto.categoria_nombre,
            slug: uniqueCategorySlug,
            descripcion: 'Categoria creada automaticamente',
            creado_por: actorId,
            actualizado_por: actorId,
          });
          const savedCategory = await manager.save(Category, newCategory);
          categoryId = savedCategory.id;
        }
      } else {
        const category = await manager.findOne(Category, {
          where: { id: categoryId, activo: true },
        });
        if (!category) {
          throw new NotFoundException(
            `Categoria con ID ${categoryId} no encontrada`,
          );
        }
      }

      // Step 2: Create Product with auto-generated slug
      const productSlug = dto.slug || slugify(dto.nombre);
      const uniqueProductSlug = await ensureUniqueSlug(
        productSlug,
        async (slug) => {
          const prod = await manager.findOne(Product, { where: { slug } });
          return prod !== null;
        },
      );

      const product = manager.create(Product, {
        categoria_id: categoryId,
        nombre: dto.nombre,
        slug: uniqueProductSlug,
        descripcion: dto.descripcion,
        img_url: dto.img_url ?? null,
        activo: true,
        creado_por: actorId,
        actualizado_por: actorId,
      });
      const savedProduct = await manager.save(Product, product);

      // Step 3: Validate SKU code uniqueness and create SKU
      const existingSku = await manager.findOne(Sku, {
        where: { codigo_sku: dto.sku.codigo_sku },
      });

      if (existingSku) {
        throw new ConflictException(
          `El codigo SKU '${dto.sku.codigo_sku}' ya esta registrado`,
        );
      }

      const sku = manager.create(Sku, {
        producto_id: savedProduct.id,
        codigo_sku: dto.sku.codigo_sku,
        nombre: dto.sku.nombre,
        peso_gramos: dto.sku.peso_gramos,
        tipo_empaque: dto.sku.tipo_empaque || 'bolsa',
        requiere_refrigeracion: dto.sku.requiere_refrigeracion ?? false,
        unidades_por_paquete: dto.sku.unidades_por_paquete ?? 1,
        activo: true,
        creado_por: actorId,
      });
      const savedSku = await manager.save(Sku, sku);

      // Step 4: Create Price
      const price = manager.create(PrecioSku, {
        sku_id: savedSku.id,
        precio: dto.precio.precio,
        moneda: dto.precio.moneda || 'USD',
        creado_por: actorId,
      });
      await manager.save(PrecioSku, price);

      return manager.findOne(Product, {
        where: { id: savedProduct.id },
        relations: ['categoria', 'skus', 'skus.precios'],
      });
    });

    if (result) {
      await this.outbox.createEvent('ProductoCreado', result.id, {
        producto_id: result.id,
        categoria_id: result.categoria_id,
        nombre: result.nombre,
        creado_por: actorId ?? null,
      });
    }

    return result;
  }

  async create(dto: Partial<Product>, actorId?: string) {
    const category = await this.categoriesRepo.findOne({
      where: { id: dto.categoria_id, activo: true },
    });
    if (!category) {
      throw new NotFoundException(`Categoria con ID ${dto.categoria_id} no encontrada`);
    }

    const baseSlug = dto.slug || slugify(dto.nombre || '');
    const uniqueSlug = await ensureUniqueSlug(baseSlug, async (slug) => {
      const existing = await this.repo.findOne({ where: { slug } });
      return existing !== null;
    });

    const p = this.repo.create({
      ...dto,
      slug: uniqueSlug,
      activo: dto.activo ?? true,
      creado_por: actorId,
      actualizado_por: actorId,
    } as Product);

    const saved = await this.repo.save(p);
    await this.outbox.createEvent('ProductoCreado', saved.id, {
      producto_id: saved.id,
      categoria_id: saved.categoria_id,
      nombre: saved.nombre,
      creado_por: actorId ?? null,
    });
    return saved;
  }

  findAll() {
    return this.repo.find({
      where: { activo: true },
      relations: ['categoria', 'skus', 'skus.precios'],
      order: { nombre: 'ASC' },
    });
  }

  findByCategory(categoriaId: string) {
    return this.repo.find({
      where: { categoria_id: categoriaId, activo: true },
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: string) {
    const product = await this.repo.findOne({
      where: { id },
      relations: ['categoria', 'skus', 'skus.precios'],
    });
    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }
    return product;
  }

  async update(id: string, dto: Partial<Product>, actorId?: string) {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
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
    } as Product);
    return this.findOne(id);
  }

  async deactivate(id: string, actorId?: string) {
    const product = await this.repo.findOne({ where: { id, activo: true } });
    if (!product) {
      throw new NotFoundException('Producto no encontrado o ya desactivado');
    }

    await this.repo.update(id, { activo: false, actualizado_por: actorId } as Product);
    await this.outbox.createEvent('ProductoDesactivado', id, {
      producto_id: id,
      nombre: product.nombre,
    });
    return this.repo.findOne({ where: { id } });
  }
}

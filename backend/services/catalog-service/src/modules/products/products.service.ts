import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateCompleteProductDto } from './dto/create-complete-product.dto';
import { Category } from '../categories/entities/category.entity';
import { Sku } from '../skus/entities/sku.entity';
import { PrecioSku } from '../prices/entities/precio-sku.entity';
import { slugify, ensureUniqueSlug } from '../../common/utils/slug.utils';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private repo: Repository<Product>,
    private dataSource: DataSource,
  ) { }

  /**
   * Creates a complete sellable product in a single transaction:
   * Category (if needed) → Product → SKU → Price
   */
  async createComplete(dto: CreateCompleteProductDto) {
    return this.dataSource.transaction(async (manager) => {
      let categoryId = dto.categoria_id;

      // Step 1: Validate or create category
      if (!categoryId) {
        if (!dto.categoria_nombre) {
          throw new BadRequestException(
            'Debe proporcionar categoria_id o categoria_nombre',
          );
        }

        // Auto-generate category slug if not provided
        const categorySlug = dto.categoria_slug || slugify(dto.categoria_nombre);

        // Check if category exists by slug
        const existingCategory = await manager.findOne(Category, {
          where: { slug: categorySlug },
        });

        if (existingCategory) {
          categoryId = existingCategory.id;
        } else {
          // Ensure unique slug for new category
          const uniqueCategorySlug = await ensureUniqueSlug(
            categorySlug,
            async (slug) => {
              const cat = await manager.findOne(Category, { where: { slug } });
              return cat !== null;
            },
          );

          // Create new category
          const newCategory = manager.create(Category, {
            nombre: dto.categoria_nombre,
            slug: uniqueCategorySlug,
            descripcion: `Categoría creada automáticamente`,
          });
          const savedCategory = await manager.save(Category, newCategory);
          categoryId = savedCategory.id;
        }
      } else {
        // Verify category exists
        const category = await manager.findOne(Category, { where: { id: categoryId } });
        if (!category) {
          throw new NotFoundException(`Categoría con ID ${categoryId} no encontrada`);
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
      });
      const savedProduct = await manager.save(Product, product);

      // Step 3: Validate SKU code uniqueness and create SKU
      const existingSku = await manager.findOne(Sku, {
        where: { codigo_sku: dto.sku.codigo_sku },
      });

      if (existingSku) {
        throw new ConflictException(
          `El código SKU '${dto.sku.codigo_sku}' ya está registrado`,
        );
      }

      const sku = manager.create(Sku, {
        producto_id: savedProduct.id,
        codigo_sku: dto.sku.codigo_sku,
        nombre: dto.sku.nombre,
        peso_gramos: dto.sku.peso_gramos,
        tipo_empaque: dto.sku.tipo_empaque || 'bolsa',
        requiere_refrigeracion: dto.sku.requiere_refrigeracion ?? false,
      });
      const savedSku = await manager.save(Sku, sku);

      // Step 4: Create Price
      const price = manager.create(PrecioSku, {
        sku_id: savedSku.id,
        precio: dto.precio.precio,
        moneda: dto.precio.moneda || 'USD',
      });
      await manager.save(PrecioSku, price);

      // Return complete product with relations
      return manager.findOne(Product, {
        where: { id: savedProduct.id },
        relations: ['categoria', 'skus', 'skus.precios'],
      });
    });
  }

  create(dto: Partial<Product>) {
    const p = this.repo.create(dto as any);
    return this.repo.save(p);
  }

  findAll() {
    return this.repo.find({
      relations: ['categoria', 'skus', 'skus.precios'],
      order: { nombre: 'ASC' },
    });
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

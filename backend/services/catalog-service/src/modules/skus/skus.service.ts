import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sku } from './entities/sku.entity';
import { Product } from '../products/entities/product.entity';
import { OutboxService } from '../outbox/outbox.service';

@Injectable()
export class SkusService {
  constructor(
    @InjectRepository(Sku) private repo: Repository<Sku>,
    @InjectRepository(Product) private productsRepo: Repository<Product>,
    private outbox: OutboxService,
  ) {}

  async create(dto: Partial<Sku>, actorId?: string) {
    const product = await this.productsRepo.findOne({
      where: { id: dto.producto_id, activo: true },
    });
    if (!product) {
      throw new NotFoundException(`Producto con ID ${dto.producto_id} no encontrado`);
    }

    const existingSku = await this.repo.findOne({
      where: { codigo_sku: dto.codigo_sku },
    });
    if (existingSku) {
      throw new ConflictException(`El codigo SKU '${dto.codigo_sku}' ya esta registrado`);
    }

    const s = this.repo.create({
      ...dto,
      tipo_empaque: dto.tipo_empaque || 'bolsa',
      requiere_refrigeracion: dto.requiere_refrigeracion ?? false,
      unidades_por_paquete: dto.unidades_por_paquete ?? 1,
      activo: dto.activo ?? true,
      creado_por: actorId,
    } as Sku);

    const saved = await this.repo.save(s);
    await this.outbox.createEvent('SkuCreado', saved.id, {
      sku_id: saved.id,
      producto_id: saved.producto_id,
      codigo_sku: saved.codigo_sku,
    });
    return saved;
  }

  findAll() {
    return this.repo.find({
      where: { activo: true },
      relations: ['producto', 'precios'],
      order: { nombre: 'ASC' },
    });
  }

  findAllComplete() {
    return this.repo.find({
      where: { activo: true },
      relations: ['producto', 'producto.categoria', 'precios'],
    });
  }

  findByProduct(productId: string) {
    return this.repo
      .createQueryBuilder('sku')
      .leftJoin('sku.producto', 'producto')
      .leftJoinAndSelect('sku.precios', 'precio', 'precio.vigente_hasta IS NULL')
      .where('sku.producto_id = :productId', { productId })
      .andWhere('sku.activo = true')
      .andWhere('producto.activo = true')
      .orderBy('sku.peso_gramos', 'ASC')
      .getMany();
  }

  search(query: string) {
    const sanitized = query.replace(/[%_]/g, '');
    if (!sanitized.trim()) {
      return Promise.resolve([]);
    }

    return this.repo
      .createQueryBuilder('sku')
      .leftJoin('sku.producto', 'producto')
      .leftJoinAndSelect('sku.precios', 'precio', 'precio.vigente_hasta IS NULL')
      .where('sku.activo = true')
      .andWhere('producto.activo = true')
      .andWhere('(sku.codigo_sku ILIKE :q OR sku.nombre ILIKE :q)', {
        q: `%${sanitized}%`,
      })
      .orderBy('sku.nombre', 'ASC')
      .limit(50)
      .getMany();
  }

  async findOne(id: string) {
    const sku = await this.repo.findOne({
      where: { id },
      relations: ['producto', 'precios'],
    });
    if (!sku) {
      throw new NotFoundException(`SKU con ID ${id} no encontrado`);
    }
    return sku;
  }

  async update(id: string, dto: Partial<Sku>) {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`SKU con ID ${id} no encontrado`);
    }

    if (dto.codigo_sku && dto.codigo_sku !== existing.codigo_sku) {
      const conflict = await this.repo.findOne({ where: { codigo_sku: dto.codigo_sku } });
      if (conflict) {
        throw new ConflictException('El codigo SKU ya esta registrado');
      }
    }

    await this.repo.update(id, dto as Sku);
    return this.findOne(id);
  }

  async deactivate(id: string) {
    const sku = await this.repo.findOne({ where: { id, activo: true } });
    if (!sku) {
      throw new NotFoundException('SKU no encontrado o ya desactivado');
    }

    await this.repo.update(id, { activo: false } as Sku);
    await this.outbox.createEvent('SkuDesactivado', id, {
      sku_id: id,
      producto_id: sku.producto_id,
      codigo_sku: sku.codigo_sku,
    });
    return this.findOne(id);
  }
}

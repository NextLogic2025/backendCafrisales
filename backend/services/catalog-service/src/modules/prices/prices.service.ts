import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull } from 'typeorm';
import { PrecioSku } from './entities/precio-sku.entity';
import { Sku } from '../skus/entities/sku.entity';
import { OutboxService } from '../outbox/outbox.service';

@Injectable()
export class PricesService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(PrecioSku) private repo: Repository<PrecioSku>,
    @InjectRepository(Sku) private skusRepo: Repository<Sku>,
    private outbox: OutboxService,
  ) {}

  async getCurrentPrice(skuId: string) {
    return this.repo.findOne({
      where: { sku_id: skuId, vigente_hasta: IsNull() },
      relations: ['sku'],
    });
  }

  async createInitialPrice(skuId: string, dto: { precio: number; moneda?: string }, actorId?: string) {
    const sku = await this.skusRepo.findOne({ where: { id: skuId, activo: true } });
    if (!sku) {
      throw new NotFoundException(`SKU con ID ${skuId} no encontrado`);
    }

    const existing = await this.repo.findOne({
      where: { sku_id: skuId, vigente_hasta: IsNull() },
    });
    if (existing) {
      throw new ConflictException('El SKU ya tiene un precio vigente');
    }

    const price = this.repo.create({
      sku_id: skuId,
      precio: dto.precio,
      moneda: dto.moneda || 'USD',
      creado_por: actorId,
    });

    const saved = await this.repo.save(price);
    await this.outbox.createEvent('PrecioSkuCreado', saved.id, {
      precio_id: saved.id,
      sku_id: skuId,
      precio: saved.precio,
      moneda: saved.moneda,
    });
    return saved;
  }

  async updatePrice(skuId: string, nuevoPrecio: number, actorId?: string) {
    const result = await this.dataSource.transaction(async (manager) => {
      const sku = await manager.findOne(Sku, { where: { id: skuId, activo: true } });
      if (!sku) {
        throw new NotFoundException(`SKU con ID ${skuId} no encontrado`);
      }

      await manager.update(
        PrecioSku,
        { sku_id: skuId, vigente_hasta: IsNull() },
        { vigente_hasta: () => 'transaction_timestamp()' } as any,
      );

      const price = manager.create(PrecioSku, {
        sku_id: skuId,
        precio: nuevoPrecio,
        moneda: 'USD',
        creado_por: actorId,
      });

      return manager.save(PrecioSku, price);
    });

    await this.outbox.createEvent('PrecioSkuActualizado', result.id, {
      precio_id: result.id,
      sku_id: skuId,
      precio: result.precio,
      moneda: result.moneda,
    });

    return result;
  }

  getHistory(skuId: string) {
    return this.repo.find({
      where: { sku_id: skuId },
      order: { vigente_desde: 'DESC' },
    });
  }

  async getBatchCurrentPrices(skuIds: string[]) {
    if (!skuIds.length) {
      return [];
    }
    if (skuIds.length > 100) {
      skuIds = skuIds.slice(0, 100);
    }

    return this.repo
      .createQueryBuilder('precio')
      .leftJoinAndSelect('precio.sku', 'sku')
      .where('precio.sku_id IN (:...skuIds)', { skuIds })
      .andWhere('precio.vigente_hasta IS NULL')
      .andWhere('sku.activo = true')
      .getMany();
  }

  findAll() {
    return this.repo.find();
  }

  async findOne(id: string) {
    const price = await this.repo.findOne({ where: { id } });
    if (!price) {
      throw new NotFoundException(`Precio con ID ${id} no encontrado`);
    }
    return price;
  }
}

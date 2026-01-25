import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PrecioSku } from './entities/precio-sku.entity';

@Injectable()
export class PricesService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(PrecioSku) private repo: Repository<PrecioSku>,
  ) {}

  async getCurrentPrice(skuId: string) {
    return this.repo.findOne({ where: { sku_id: skuId, vigente_hasta: null } });
  }

  async updatePrice(dto: { sku_id: string; precio: number }) {
    // Transactional: close previous vigente and insert new
    return this.dataSource.transaction(async manager => {
      await manager.query(`UPDATE app.precios_sku SET vigente_hasta = transaction_timestamp() WHERE sku_id = $1 AND vigente_hasta IS NULL`, [dto.sku_id]);
      const entity = manager.create(PrecioSku, { sku_id: dto.sku_id, precio: dto.precio } as any);
      return manager.save(PrecioSku, entity);
    });
  }

  findAll() {
    return this.repo.find();
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async updateById(id: string, dto: Partial<PrecioSku>) {
    await this.repo.update(id, dto as any);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.repo.delete(id);
    return { deleted: true };
  }
}

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Sku } from '../../skus/entities/sku.entity';

@Entity({ schema: 'app', name: 'precios_sku' })
export class PrecioSku {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  sku_id: string;

  @ManyToOne(() => Sku, (sku) => sku.precios)
  @JoinColumn({ name: 'sku_id' })
  sku: Sku;

  @Column('numeric', { precision: 12, scale: 2 })
  precio: number;

  @Column({ type: 'char', length: 3, default: 'USD' })
  moneda: string;

  @Column({ type: 'timestamptz', default: () => 'transaction_timestamp()' })
  vigente_desde: Date;

  @Column({ type: 'timestamptz', nullable: true })
  vigente_hasta?: Date;

  @Column({ type: 'timestamptz', default: () => 'transaction_timestamp()' })
  creado_en: Date;

  @Column({ type: 'uuid', nullable: true })
  creado_por?: string;
}

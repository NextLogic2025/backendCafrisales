import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ schema: 'app', name: 'precios_sku' })
export class PrecioSku {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  sku_id: string;

  @Column('numeric', { precision: 12, scale: 2 })
  precio: number;

  @Column({ type: 'timestamptz', default: () => 'transaction_timestamp()' })
  vigente_desde: Date;

  @Column({ type: 'timestamptz', nullable: true })
  vigente_hasta?: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { PrecioSku } from '../../prices/entities/precio-sku.entity';

@Entity({ schema: 'app', name: 'skus' })
export class Sku {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'producto_id' })
  producto: Product;

  @Column({ type: 'uuid', name: 'producto_id' })
  producto_id: string;

  @Column({ length: 50 })
  codigo_sku: string;

  @Column({ length: 255 })
  nombre: string;

  @Column('int')
  peso_gramos: number;

  @Column({ length: 50 })
  tipo_empaque: string;

  @Column({ type: 'boolean', default: false })
  requiere_refrigeracion: boolean;

  @Column({ type: 'int', default: 1 })
  unidades_por_paquete: number;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ type: 'timestamptz', default: () => 'transaction_timestamp()' })
  creado_en: Date;

  @Column({ type: 'uuid', nullable: true })
  creado_por?: string;

  @OneToMany(() => PrecioSku, (precio) => precio.sku)
  precios: PrecioSku[];
}

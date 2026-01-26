import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { Sku } from '../../skus/entities/sku.entity';

@Entity({ schema: 'app', name: 'productos' })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'categoria_id' })
  categoria: Category;

  @Column({ type: 'uuid', name: 'categoria_id' })
  categoria_id: string;

  @Column({ length: 255 })
  nombre: string;

  @Column({ length: 255 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ type: 'timestamptz', default: () => 'transaction_timestamp()' })
  creado_en: Date;

  @Column({ type: 'timestamptz', default: () => 'transaction_timestamp()' })
  actualizado_en: Date;

  @Column({ type: 'uuid', nullable: true })
  creado_por?: string;

  @Column({ type: 'uuid', nullable: true })
  actualizado_por?: string;

  @Column({ type: 'int', default: 1 })
  version: number;

  @OneToMany(() => Sku, (sku) => sku.producto)
  skus: Sku[];
}

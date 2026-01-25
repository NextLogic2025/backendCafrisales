import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from '../../products/entities/product.entity';

@Entity({ schema: 'app', name: 'skus' })
export class Sku {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'producto_id' })
  producto: Product;

  @Column({ length: 50 })
  codigo_sku: string;

  @Column({ length: 255 })
  nombre: string;

  @Column('int')
  peso_gramos: number;
}

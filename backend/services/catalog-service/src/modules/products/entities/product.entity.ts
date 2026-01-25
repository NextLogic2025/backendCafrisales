import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Category } from '../../categories/entities/category.entity';

@Entity({ schema: 'app', name: 'productos' })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'categoria_id' })
  categoria: Category;

  @Column({ length: 255 })
  nombre: string;

  @Column({ length: 255 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  descripcion?: string;
}

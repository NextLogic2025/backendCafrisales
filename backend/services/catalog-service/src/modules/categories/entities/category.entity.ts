import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ schema: 'app', name: 'categorias' })
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 120 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  descripcion?: string;
}

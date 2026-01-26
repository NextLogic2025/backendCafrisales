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

  @Column({ type: 'varchar', length: 500, nullable: true })
  img_url?: string;

  @Column({ type: 'int', default: 0 })
  orden: number;

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
}

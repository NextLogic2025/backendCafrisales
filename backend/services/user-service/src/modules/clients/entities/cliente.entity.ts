import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'clientes', schema: 'app' })
export class Cliente {
  @PrimaryColumn('uuid')
  usuario_id: string;

  @Column('uuid')
  canal_id: string;

  @Column({ length: 255 })
  nombre_comercial: string;

  @Column({ length: 50, nullable: true })
  ruc?: string;

  @Column('uuid')
  zona_id: string;

  @Column({ type: 'text' })
  direccion: string;

  @Column({ type: 'numeric', precision: 9, scale: 6, nullable: true })
  latitud?: number;

  @Column({ type: 'numeric', precision: 9, scale: 6, nullable: true })
  longitud?: number;

  @Column({ type: 'uuid', nullable: true })
  vendedor_asignado_id?: string;

  @Column({ type: 'timestamptz', default: () => 'transaction_timestamp()' })
  creado_en: Date;

  @Column({ type: 'uuid', nullable: true })
  creado_por?: string;
}

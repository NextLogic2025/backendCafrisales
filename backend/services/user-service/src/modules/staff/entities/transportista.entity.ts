import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'transportistas', schema: 'app' })
export class Transportista {
  @PrimaryColumn('uuid')
  usuario_id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  codigo_empleado: string;

  @Column({ type: 'varchar', length: 50 })
  numero_licencia: string;

  @Column({ type: 'date', nullable: true })
  licencia_vence_en?: Date;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ type: 'timestamptz', default: () => 'transaction_timestamp()', name: 'creado_en' })
  creado_en: Date;
}

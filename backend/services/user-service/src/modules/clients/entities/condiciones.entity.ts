import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'condiciones_comerciales_cliente', schema: 'app' })
export class CondicionesComercialesCliente {
  @PrimaryColumn('uuid')
  cliente_id: string;

  @Column({ type: 'boolean', nullable: true })
  permite_negociacion?: boolean;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  porcentaje_descuento_max?: number;

  @Column({ type: 'boolean', nullable: true })
  requiere_aprobacion_supervisor?: boolean;

  @Column({ type: 'text', nullable: true })
  observaciones?: string;

  @Column({ type: 'timestamptz', default: () => 'transaction_timestamp()' })
  actualizado_en: Date;

  @Column({ type: 'uuid', nullable: true })
  actualizado_por?: string;
}

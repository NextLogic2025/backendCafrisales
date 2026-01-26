import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('outbox_eventos', { schema: 'app' })
export class OutboxEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  agregado: string;

  @Column({ name: 'tipo_evento', type: 'text' })
  tipoEvento: string;

  @Column({ name: 'clave_agregado', type: 'text' })
  claveAgregado: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column({ name: 'creado_en', type: 'timestamptz', default: () => 'transaction_timestamp()' })
  creadoEn: Date;

  @Column({ name: 'procesado_en', type: 'timestamptz', nullable: true })
  procesadoEn?: Date;

  @Column({ type: 'int', default: 0 })
  intentos: number;
}

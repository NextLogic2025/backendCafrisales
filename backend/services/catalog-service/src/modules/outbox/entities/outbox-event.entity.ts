import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ schema: 'app', name: 'outbox_eventos' })
export class OutboxEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  agregado: string;

  @Column({ type: 'text' })
  tipo_evento: string;

  @Column({ type: 'text' })
  clave_agregado: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column({ type: 'timestamptz', default: () => 'transaction_timestamp()' })
  creado_en: Date;

  @Column({ type: 'timestamptz', nullable: true })
  procesado_en?: Date;

  @Column({ type: 'int', default: 0 })
  intentos: number;
}

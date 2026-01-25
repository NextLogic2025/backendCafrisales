import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'outbox_eventos', schema: 'app' })
export class Outbox {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  agregado: string;

  @Column({ type: 'text' })
  tipo_evento: string;

  @Column({ type: 'text' })
  clave_agregado: string;

  @Column({ type: 'jsonb' })
  payload: any;

  @Column({ type: 'timestamptz', default: () => 'transaction_timestamp()' })
  creado_en: Date;

  @Column({ type: 'timestamptz', nullable: true })
  procesado_en?: Date;
}

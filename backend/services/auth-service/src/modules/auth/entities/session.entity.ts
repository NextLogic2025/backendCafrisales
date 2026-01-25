import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Credential } from './credential.entity';

@Entity({ schema: 'app', name: 'sesiones' })
export class Session {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column('uuid', { name: 'usuario_id' })
  usuario_id: string;

  @ManyToOne(() => Credential)
  @JoinColumn({ name: 'usuario_id' })
  usuario?: Credential;

  @Column({ name: 'refresh_hash', type: 'text' })
  refresh_hash: string;

  @Column({ name: 'direccion_ip', type: 'inet', nullable: true })
  direccion_ip?: string;

  @Column({ name: 'user_agent', nullable: true, type: 'text' })
  user_agent?: string;

  @Column({ name: 'dispositivo_meta', type: 'jsonb', default: () => "'{}'::jsonb" })
  dispositivo_meta: any;

  @Column({ name: 'expira_en', type: 'timestamptz' })
  expira_en: Date;

  @Column({ name: 'revocado_en', type: 'timestamptz', nullable: true })
  revocado_en?: Date;

  @Column({ name: 'creado_en', type: 'timestamptz', default: () => 'transaction_timestamp()' })
  creado_en: Date;
}

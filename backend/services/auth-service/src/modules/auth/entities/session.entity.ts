import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Credential } from './credential.entity';

/**
 * Sesiones activas con refresh tokens hasheados.
 * Mapea a app.sesiones en cafrilosa_auth.
 * 
 * NOTA: refresh_hash almacena el hash argon2 del refresh token.
 * El token en claro NUNCA se persiste.
 * Los índices idx_sesiones_usuario_activas y idx_sesiones_expira_activas
 * optimizan consultas de sesiones activas.
 */
@Entity({ schema: 'app', name: 'sesiones' })
export class Session {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column('uuid', { name: 'usuario_id' })
  usuario_id: string;

  @ManyToOne(() => Credential)
  @JoinColumn({ name: 'usuario_id' })
  usuario?: Credential;

  @Column({ name: 'refresh_hash', type: 'text', unique: true })
  refresh_hash: string;

  @Column({ name: 'direccion_ip', type: 'inet', nullable: true })
  direccion_ip?: string;

  @Column({ name: 'user_agent', nullable: true, type: 'text' })
  user_agent?: string;

  @Column({ name: 'dispositivo_meta', type: 'jsonb', default: () => "'{}'::jsonb" })
  dispositivo_meta: Record<string, unknown>;

  @Column({ name: 'expira_en', type: 'timestamptz' })
  expira_en: Date;

  @Column({ name: 'revocado_en', type: 'timestamptz', nullable: true })
  revocado_en?: Date;

  @Column({ name: 'revocado_por', type: 'uuid', nullable: true })
  revocado_por?: string;

  @Column({ name: 'revocado_motivo', type: 'text', nullable: true })
  revocado_motivo?: string;

  @Column({ name: 'creado_en', type: 'timestamptz', default: () => 'transaction_timestamp()' })
  creado_en: Date;
}

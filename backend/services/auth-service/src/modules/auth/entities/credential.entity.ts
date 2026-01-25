import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ schema: 'app', name: 'credenciales' })
export class Credential {
  // DB column is usuario_id uuid PRIMARY KEY (no default in DDL)
  @PrimaryColumn('uuid', { name: 'usuario_id' })
  id: string;

  @Column({ name: 'email', type: 'citext', unique: true })
  email: string;

  // DB column is password_hash
  @Column({ name: 'password_hash', type: 'text' })
  password: string;

  @Column({ name: 'password_alg', type: 'text', default: 'argon2id' })
  password_alg?: string;

  @Column({
    name: 'estado',
    type: 'enum',
    enum: ['activo', 'bloqueado', 'suspendido'],
    enumName: 'estado_credencial',
    default: 'activo',
  })
  estado: 'activo' | 'bloqueado' | 'suspendido';

  @Column({
    name: 'bloqueado_motivo',
    type: 'enum',
    enum: ['intentos_fallidos', 'sospecha_fraude', 'solicitud_usuario', 'administrativo'],
    enumName: 'motivo_bloqueo',
    nullable: true,
  })
  bloqueado_motivo?: string | null;

  @Column({ name: 'bloqueado_en', type: 'timestamptz', nullable: true })
  bloqueado_en?: Date | null;

  @Column({ name: 'ultimo_login_en', type: 'timestamptz', nullable: true })
  ultimo_login_en?: Date | null;

  @Column({ name: 'ultimo_login_ip', type: 'inet', nullable: true })
  ultimo_login_ip?: string | null;

  @Column({ name: 'creado_en', type: 'timestamptz', default: () => 'transaction_timestamp()' })
  creado_en: Date;

  @Column({ name: 'actualizado_en', type: 'timestamptz', default: () => 'transaction_timestamp()' })
  actualizado_en: Date;

  @Column({ name: 'creado_por', type: 'uuid', nullable: true })
  creado_por?: string | null;

  @Column({ name: 'actualizado_por', type: 'uuid', nullable: true })
  actualizado_por?: string | null;

  @Column({ name: 'version', type: 'int', default: 1 })
  version: number;
}

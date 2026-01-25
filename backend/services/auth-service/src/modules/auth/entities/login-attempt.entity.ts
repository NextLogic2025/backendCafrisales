import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'audit', name: 'intentos_login' })
export class LoginAttempt {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'citext' })
  email: string;

  @Column({ type: 'inet', name: 'direccion_ip' })
  direccion_ip: string;

  @Column({ type: 'boolean', name: 'exitoso' })
  exitoso: boolean;

  @Column({ type: 'text', name: 'motivo_fallo', nullable: true })
  motivo_fallo?: string;

  @Column({ type: 'timestamptz', name: 'intentado_en', default: () => 'transaction_timestamp()' })
  intentado_en: Date;
}

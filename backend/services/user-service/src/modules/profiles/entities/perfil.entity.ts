import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'perfiles_usuario', schema: 'app' })
export class Perfil {
  @PrimaryColumn('uuid')
  usuario_id: string;

  @Column({ length: 100 })
  nombres: string;

  @Column({ length: 100 })
  apellidos: string;

  @Column({ length: 30, nullable: true })
  telefono?: string;

  @Column({ type: 'text', nullable: true })
  url_avatar?: string;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  preferencias: any;

  @Column({ type: 'timestamptz', default: () => 'transaction_timestamp()' })
  creado_en: Date;

  @Column({ type: 'timestamptz', default: () => 'transaction_timestamp()' })
  actualizado_en: Date;
}

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
}

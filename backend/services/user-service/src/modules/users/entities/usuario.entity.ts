import { Column, Entity, OneToOne, PrimaryGeneratedColumn, DeleteDateColumn } from 'typeorm';
import { PerfilUsuario } from './perfil-usuario.entity';
import { RolUsuario } from '../../../common/enums/rol-usuario.enum';

@Entity({ name: 'usuarios', schema: 'app' })
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'citext', unique: true })
  email: string;

  @Column({
    type: 'enum',
    enum: RolUsuario,
    enumName: 'rol_usuario',
  })
  rol: RolUsuario;

  @Column({
    type: 'enum',
    enum: ['activo', 'inactivo', 'suspendido'],
    enumName: 'estado_usuario',
    default: 'activo',
  })
  estado: 'activo' | 'inactivo' | 'suspendido';

  @Column({ type: 'timestamptz', default: () => 'transaction_timestamp()' })
  creado_en: Date;
  @Column({ type: 'uuid', nullable: true })
  creado_por?: string;

  @Column({ type: 'timestamptz', default: () => 'transaction_timestamp()' })
  actualizado_en: Date;

  @Column({ type: 'uuid', nullable: true })
  actualizado_por?: string;

  @Column({ type: 'int', default: 1 })
  version: number;

  @DeleteDateColumn({ name: 'eliminado_en', type: 'timestamptz', nullable: true })
  deletedAt?: Date;

  @OneToOne(() => PerfilUsuario, (perfil) => perfil.usuario)
  perfil: PerfilUsuario;
}

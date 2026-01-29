import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { Usuario } from './usuario.entity';

@Entity({ name: 'perfiles_usuario', schema: 'app' })
export class PerfilUsuario {
    @PrimaryColumn('uuid')
    usuario_id: string;

    @Column({ length: 100 })
    nombres: string;

    @Column({ length: 100 })
    apellidos: string;

    @Column({ length: 30, nullable: true })
    telefono: string;

    @Column({ type: 'text', nullable: true })
    url_avatar: string;

    @Column({ type: 'jsonb', default: {} })
    preferencias: Record<string, any>;

    @Column({ type: 'timestamptz', default: () => 'transaction_timestamp()' })
    creado_en: Date;

    @Column({ type: 'timestamptz', default: () => 'transaction_timestamp()' })
    actualizado_en: Date;

    @Column({ type: 'uuid', nullable: true })
    actualizado_por: string;

    @Column({ default: 1 })
    version: number;

    @OneToOne(() => Usuario, (usuario) => usuario.perfil)
    @JoinColumn({ name: 'usuario_id' })
    usuario: Usuario;
}

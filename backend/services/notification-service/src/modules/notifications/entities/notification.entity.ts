import { Column, Entity, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity({ schema: 'app', name: 'notificaciones' })
@Index(['usuarioId', 'creadoEn'])
@Index(['usuarioId', 'creadoEn'], { where: '"leida" = false' })
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'usuario_id', type: 'uuid' })
    @Index()
    usuarioId: string;

    @Column({ name: 'tipo', type: 'varchar', length: 100 })
    tipo: string;

    @Column({ name: 'titulo', type: 'varchar', length: 255 })
    titulo: string;

    @Column({ name: 'mensaje', type: 'text' })
    mensaje: string;

    @Column({ name: 'payload', type: 'jsonb', nullable: true })
    payload: Record<string, any>;

    @Column({ name: 'origen_servicio', type: 'varchar', length: 50 })
    origenServicio: string;

    @Column({ name: 'origen_evento_id', type: 'uuid', nullable: true })
    origenEventoId: string;

    @Column({ name: 'prioridad', type: 'varchar', default: 'normal' })
    prioridad: 'baja' | 'normal' | 'alta' | 'urgente';

    @Column({ name: 'requiere_accion', type: 'boolean', default: false })
    requiereAccion: boolean;

    @Column({ name: 'url_accion', type: 'text', nullable: true })
    urlAccion: string;

    @Column({ name: 'leida', type: 'boolean', default: false })
    leida: boolean;

    @Column({ name: 'leida_en', type: 'timestamptz', nullable: true })
    leidaEn: Date;

    @Column({ name: 'expira_en', type: 'timestamptz', nullable: true })
    expiraEn: Date;

    @Column({ name: 'creado_en', type: 'timestamptz', default: () => 'transaction_timestamp()' })
    creadoEn: Date;

    @Column({ name: 'actualizado_en', type: 'timestamptz', default: () => 'transaction_timestamp()' })
    actualizadoEn: Date;

    @Column({ name: 'version', type: 'int', default: 1 })
    version: number;
}

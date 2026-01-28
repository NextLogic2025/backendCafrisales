import { Column, Entity, PrimaryGeneratedColumn, Index, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { TipoNotificacion } from './tipo-notificacion.entity';
import { HistorialEnvio } from './historial-envio.entity';

/**
 * ENUM prioridad_notificacion mapeado para TypeORM.
 * Valores deben coincidir con el ENUM en PostgreSQL.
 */
export enum PrioridadNotificacion {
    BAJA = 'baja',
    NORMAL = 'normal',
    ALTA = 'alta',
    URGENTE = 'urgente',
}

/**
 * Notificación para usuarios del sistema (WebSocket/email/sms).
 * Incluye trazabilidad por evento origen e idempotencia.
 *
 * CHECK constraints en BD:
 * - leida/leida_en coherencia
 * - requiere_accion → url_accion requerida
 * - expira_en > creado_en
 */
@Entity({ schema: 'app', name: 'notificaciones' })
@Index('idx_notif_usuario_fecha', ['usuarioId', 'creadoEn'])
@Index('idx_notif_usuario_no_leidas', ['usuarioId', 'creadoEn'], { where: '"leida" = false' })
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    /** Referencia lógica a user-service */
    @Column({ name: 'usuario_id', type: 'uuid' })
    @Index()
    usuarioId: string;

    /** FK al catálogo de tipos de notificación */
    @Column({ name: 'tipo_id', type: 'uuid' })
    tipoId: string;

    @Column({ name: 'titulo', type: 'varchar', length: 255 })
    titulo: string;

    @Column({ name: 'mensaje', type: 'text' })
    mensaje: string;

    /** Servicio que originó la notificación (order, credit, route, etc.) */
    @Column({ name: 'origen_servicio', type: 'varchar', length: 50 })
    origenServicio: string;

    /** ID del evento outbox original (para trazabilidad e idempotencia) */
    @Column({ name: 'origen_evento_id', type: 'uuid', nullable: true })
    origenEventoId: string | null;

    /** Metadata flexible (NO datos core del negocio) */
    @Column({ name: 'payload', type: 'jsonb', default: {} })
    payload: Record<string, unknown>;

    @Column({
        name: 'prioridad',
        type: 'enum',
        enum: PrioridadNotificacion,
        enumName: 'prioridad_notificacion',
        default: PrioridadNotificacion.NORMAL,
    })
    prioridad: PrioridadNotificacion;

    /** Indica si la notificación requiere una acción del usuario */
    @Column({ name: 'requiere_accion', type: 'boolean', default: false })
    requiereAccion: boolean;

    /** Ruta/URL relativa para navegación (requerida si requiereAccion = true) */
    @Column({ name: 'url_accion', type: 'text', nullable: true })
    urlAccion: string | null;

    @Column({ name: 'leida', type: 'boolean', default: false })
    leida: boolean;

    /** Timestamp de cuándo se marcó como leída */
    @Column({ name: 'leida_en', type: 'timestamptz', nullable: true })
    leidaEn: Date | null;

    /** Fecha de expiración opcional */
    @Column({ name: 'expira_en', type: 'timestamptz', nullable: true })
    expiraEn: Date | null;

    @Column({ name: 'creado_en', type: 'timestamptz', default: () => 'transaction_timestamp()' })
    creadoEn: Date;

    @Column({ name: 'actualizado_en', type: 'timestamptz', default: () => 'transaction_timestamp()' })
    actualizadoEn: Date;

    @Column({ name: 'creado_por', type: 'uuid', nullable: true })
    creadoPor: string | null;

    @Column({ name: 'actualizado_por', type: 'uuid', nullable: true })
    actualizadoPor: string | null;

    @Column({ name: 'version', type: 'int', default: 1 })
    version: number;

    @ManyToOne(() => TipoNotificacion, (t) => t.notificaciones)
    @JoinColumn({ name: 'tipo_id' })
    tipo: TipoNotificacion;

    @OneToMany(() => HistorialEnvio, (h) => h.notificacion)
    historialEnvios: HistorialEnvio[];
}


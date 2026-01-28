import { Column, Entity, PrimaryColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { TipoNotificacion } from './tipo-notificacion.entity';

/**
 * Override de canales por tipo de notificación para un usuario.
 * Si no existe registro, se usan los defaults de PreferenciaNotificacion.
 * null significa "usar default", true/false significa "forzar valor".
 */
@Entity({ schema: 'app', name: 'suscripciones_notificacion' })
export class SuscripcionNotificacion {
    /** Parte de la clave primaria compuesta */
    @PrimaryColumn({ name: 'usuario_id', type: 'uuid' })
    usuarioId: string;

    /** Parte de la clave primaria compuesta (FK a tipos_notificacion) */
    @PrimaryColumn({ name: 'tipo_id', type: 'uuid' })
    tipoId: string;

    /** Override para WebSocket (null = usar default) */
    @Column({ name: 'websocket_enabled', type: 'boolean', nullable: true })
    websocketEnabled: boolean | null;

    /** Override para email (null = usar default) */
    @Column({ name: 'email_enabled', type: 'boolean', nullable: true })
    emailEnabled: boolean | null;

    /** Override para SMS (null = usar default) */
    @Column({ name: 'sms_enabled', type: 'boolean', nullable: true })
    smsEnabled: boolean | null;

    @Column({ name: 'creado_en', type: 'timestamptz', default: () => 'transaction_timestamp()' })
    creadoEn: Date;

    @Column({ name: 'actualizado_en', type: 'timestamptz', default: () => 'transaction_timestamp()' })
    actualizadoEn: Date;

    @Column({ name: 'version', type: 'int', default: 1 })
    version: number;

    @ManyToOne(() => TipoNotificacion, (t) => t.suscripciones, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'tipo_id' })
    @Index('idx_suscripciones_tipo')
    tipo: TipoNotificacion;
}

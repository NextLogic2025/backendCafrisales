import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * Preferencias por defecto de notificación por usuario.
 * Incluye configuración de canales (websocket, email, sms) y "no molestar".
 */
@Entity({ schema: 'app', name: 'preferencias_notificacion' })
export class PreferenciaNotificacion {
    /** El usuario_id actúa como clave primaria */
    @PrimaryColumn({ name: 'usuario_id', type: 'uuid' })
    usuarioId: string;

    /** Default: recibir notificaciones por WebSocket */
    @Column({ name: 'websocket_enabled', type: 'boolean', default: true })
    websocketEnabled: boolean;

    /** Default: recibir notificaciones por email */
    @Column({ name: 'email_enabled', type: 'boolean', default: true })
    emailEnabled: boolean;

    /** Default: recibir notificaciones por SMS */
    @Column({ name: 'sms_enabled', type: 'boolean', default: false })
    smsEnabled: boolean;

    /** Modo no molestar activado */
    @Column({ name: 'no_molestar', type: 'boolean', default: false })
    noMolestar: boolean;

    /** Hora de inicio del modo no molestar (HH:mm) */
    @Column({ name: 'no_molestar_desde', type: 'time', nullable: true })
    noMolestarDesde: string | null;

    /** Hora de fin del modo no molestar (HH:mm) */
    @Column({ name: 'no_molestar_hasta', type: 'time', nullable: true })
    noMolestarHasta: string | null;

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
}

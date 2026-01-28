import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Notification } from './notification.entity';

/**
 * ENUM canal_notificacion mapeado para TypeORM.
 * Valores deben coincidir con el ENUM en PostgreSQL.
 */
export enum CanalNotificacion {
    WEBSOCKET = 'websocket',
    EMAIL = 'email',
    SMS = 'sms',
}

/**
 * Historial de envíos por canal (observabilidad y debugging).
 * Registra cada intento de envío y si fue exitoso o no.
 */
@Entity({ schema: 'app', name: 'historial_envios' })
export class HistorialEnvio {
    /** IDENTITY generado por PostgreSQL */
    @PrimaryGeneratedColumn('identity', { type: 'bigint' })
    id: string;

    @Column({ name: 'notificacion_id', type: 'uuid' })
    notificacionId: string;

    /** Canal utilizado para el envío */
    @Column({
        name: 'canal',
        type: 'enum',
        enum: CanalNotificacion,
        enumName: 'canal_notificacion',
    })
    canal: CanalNotificacion;

    /** Indica si el envío fue exitoso */
    @Column({ name: 'exitoso', type: 'boolean' })
    exitoso: boolean;

    /** Mensaje de error si el envío falló */
    @Column({ name: 'error_mensaje', type: 'text', nullable: true })
    errorMensaje: string | null;

    @Column({ name: 'enviado_en', type: 'timestamptz', default: () => 'transaction_timestamp()' })
    enviadoEn: Date;

    @ManyToOne(() => Notification, (n) => n.historialEnvios, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'notificacion_id' })
    @Index('idx_historial_notificacion')
    notificacion: Notification;
}

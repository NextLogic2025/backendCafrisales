import { Column, Entity, PrimaryGeneratedColumn, Index, OneToMany } from 'typeorm';
import { Notification } from './notification.entity';
import { SuscripcionNotificacion } from './suscripcion-notificacion.entity';

/**
 * Catálogo de tipos de notificación.
 * Permite extensibilidad sin migraciones a diferencia de un ENUM.
 */
@Entity({ schema: 'app', name: 'tipos_notificacion' })
export class TipoNotificacion {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    /** Código único del tipo (ej: "pedido_creado", "credito_aprobado") */
    @Column({ name: 'codigo', type: 'varchar', length: 50, unique: true })
    @Index('idx_tipos_notificacion_activos', { where: 'activo = true' })
    codigo: string;

    /** Nombre legible del tipo */
    @Column({ name: 'nombre', type: 'varchar', length: 120 })
    nombre: string;

    @Column({ name: 'descripcion', type: 'text', nullable: true })
    descripcion: string | null;

    @Column({ name: 'activo', type: 'boolean', default: true })
    activo: boolean;

    @Column({ name: 'creado_en', type: 'timestamptz', default: () => 'transaction_timestamp()' })
    creadoEn: Date;

    @Column({ name: 'creado_por', type: 'uuid', nullable: true })
    creadoPor: string | null;

    @OneToMany(() => Notification, (n) => n.tipo)
    notificaciones: Notification[];

    @OneToMany(() => SuscripcionNotificacion, (s) => s.tipo)
    suscripciones: SuscripcionNotificacion[];
}

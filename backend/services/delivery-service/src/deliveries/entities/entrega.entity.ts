import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { EstadoEntrega } from '../../common/constants/delivery-enums';
import { EvidenciaEntrega } from '../../evidence/entities/evidencia-entrega.entity';
import { IncidenciaEntrega } from '../../incidents/entities/incidencia-entrega.entity';

@Entity({ name: 'entregas', schema: 'app' })
export class Entrega {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'pedido_id', type: 'uuid' })
    pedido_id: string;

    @Column({ name: 'rutero_logistico_id', type: 'uuid' })
    rutero_logistico_id: string;

    @Column({ name: 'transportista_id', type: 'uuid' })
    transportista_id: string;

    @Column({
        type: 'enum',
        enum: EstadoEntrega,
        default: EstadoEntrega.PENDIENTE,
    })
    estado: EstadoEntrega;

    @Column({ name: 'asignado_en', type: 'timestamptz', nullable: true })
    asignado_en: Date;

    @Column({ name: 'salida_ruta_en', type: 'timestamptz', nullable: true })
    salida_ruta_en: Date;

    @Column({ name: 'entregado_en', type: 'timestamptz', nullable: true })
    entregado_en: Date;

    @Column({ name: 'motivo_no_entrega', type: 'text', nullable: true })
    motivo_no_entrega: string;

    @Column({ name: 'observaciones', type: 'text', nullable: true })
    observaciones: string;

    @Column({ name: 'latitud', type: 'numeric', precision: 9, scale: 6, nullable: true })
    latitud: number;

    @Column({ name: 'longitud', type: 'numeric', precision: 9, scale: 6, nullable: true })
    longitud: number;

    @CreateDateColumn({ name: 'creado_en' })
    creado_en: Date;

    @UpdateDateColumn({ name: 'actualizado_en' })
    actualizado_en: Date;

    @Column({ name: 'creado_por', type: 'uuid', nullable: true })
    creado_por: string;

    @Column({ name: 'actualizado_por', type: 'uuid', nullable: true })
    actualizado_por: string;

    @Column({ name: 'version', type: 'int', default: 1 })
    version: number;

    @OneToMany(() => EvidenciaEntrega, (evidencia) => evidencia.entrega)
    evidencias: EvidenciaEntrega[];

    @OneToMany(() => IncidenciaEntrega, (incidencia) => incidencia.entrega)
    incidencias: IncidenciaEntrega[];
}

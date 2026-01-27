import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { SeveridadIncidencia } from '../../common/constants/delivery-enums';
import { Entrega } from '../../deliveries/entities/entrega.entity';

@Entity({ name: 'incidencias_entrega', schema: 'app' })
export class IncidenciaEntrega {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'entrega_id', type: 'uuid' })
    entrega_id: string;

    @Column({ name: 'tipo_incidencia', type: 'varchar', length: 100 })
    tipo_incidencia: string;

    @Column({
        type: 'enum',
        enum: SeveridadIncidencia,
        default: SeveridadIncidencia.MEDIA,
    })
    severidad: SeveridadIncidencia;

    @Column({ type: 'text' })
    descripcion: string;

    @Column({ name: 'reportado_por_id', type: 'uuid' })
    reportado_por_id: string;

    @Column({ name: 'reportado_en', type: 'timestamptz' })
    reportado_en: Date;

    @Column({ name: 'resuelto_en', type: 'timestamptz', nullable: true })
    resuelto_en: Date;

    @Column({ name: 'resuelto_por_id', type: 'uuid', nullable: true })
    resuelto_por_id: string;

    @Column({ name: 'resolucion', type: 'text', nullable: true })
    resolucion: string;

    @CreateDateColumn({ name: 'creado_en' })
    creado_en: Date;

    @ManyToOne(() => Entrega, (entrega) => entrega.incidencias)
    @JoinColumn({ name: 'entrega_id' })
    entrega: Entrega;
}

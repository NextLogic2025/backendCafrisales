import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
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
    entregaId: string;

    @Column({ type: 'varchar', length: 200 })
    titulo: string;

    @Column({ type: 'text' })
    descripcion: string;

    @Column({
        type: 'enum',
        enum: SeveridadIncidencia,
        default: SeveridadIncidencia.MEDIA,
    })
    severidad: SeveridadIncidencia;

    @Column({ name: 'reportado_por_user_id', type: 'uuid', nullable: true })
    reportadoPorUserId: string;

    @Column({ name: 'resuelto', type: 'boolean', default: false })
    resuelto: boolean;

    @Column({ name: 'fecha_resolucion', type: 'timestamp', nullable: true })
    fechaResolucion: Date;

    @Column({ name: 'resolucion_notas', type: 'text', nullable: true })
    resolucionNotas: string;

    @Column({ name: 'resuelto_por_user_id', type: 'uuid', nullable: true })
    resueltoPorUserId: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @ManyToOne(() => Entrega, (entrega) => entrega.incidencias)
    @JoinColumn({ name: 'entrega_id' })
    entrega: Entrega;
}

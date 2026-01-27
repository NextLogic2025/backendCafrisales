import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { TipoEvidencia } from '../../common/constants/delivery-enums';
import { Entrega } from '../../deliveries/entities/entrega.entity';

@Entity({ name: 'evidencias_entrega', schema: 'app' })
export class EvidenciaEntrega {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'entrega_id', type: 'uuid' })
    entrega_id: string;

    @Column({
        type: 'enum',
        enum: TipoEvidencia,
    })
    tipo: TipoEvidencia;

    @Column({ type: 'text' })
    url: string;

    @Column({ name: 'hash_archivo', type: 'text', nullable: true })
    hash_archivo: string;

    @Column({ name: 'mime_type', type: 'varchar', length: 100, nullable: true })
    mime_type: string;

    @Column({ name: 'tamano_bytes', type: 'bigint', nullable: true })
    tamano_bytes: number;

    @Column({ type: 'text', nullable: true })
    descripcion: string;

    @Column({ type: 'jsonb', default: {} })
    meta: any;

    @CreateDateColumn({ name: 'creado_en' })
    creado_en: Date;

    @Column({ name: 'creado_por', type: 'uuid', nullable: true })
    creado_por: string;

    @ManyToOne(() => Entrega, (entrega) => entrega.evidencias)
    @JoinColumn({ name: 'entrega_id' })
    entrega: Entrega;
}

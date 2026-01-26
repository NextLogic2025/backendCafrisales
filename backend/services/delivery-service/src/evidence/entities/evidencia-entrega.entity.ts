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
    entregaId: string;

    @Column({
        type: 'enum',
        enum: TipoEvidencia,
        default: TipoEvidencia.FOTO,
    })
    tipo: TipoEvidencia;

    @Column({ name: 'archivo_url', type: 'varchar', length: 500 })
    archivoUrl: string;

    @Column({ name: 'archivo_nombre', type: 'varchar', length: 255 })
    archivoNombre: string;

    @Column({ name: 'archivo_size', type: 'integer', nullable: true })
    archivoSize: number;

    @Column({ name: 'mime_type', type: 'varchar', length: 100, nullable: true })
    mimeType: string;

    @Column({ type: 'text', nullable: true })
    descripcion: string;

    @Column({ name: 'latitud_captura', type: 'decimal', precision: 10, scale: 7, nullable: true })
    latitudCaptura: number;

    @Column({ name: 'longitud_captura', type: 'decimal', precision: 10, scale: 7, nullable: true })
    longitudCaptura: number;

    @Column({ name: 'capturado_por_user_id', type: 'uuid', nullable: true })
    capturadoPorUserId: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @ManyToOne(() => Entrega, (entrega) => entrega.evidencias)
    @JoinColumn({ name: 'entrega_id' })
    entrega: Entrega;
}

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from 'typeorm';
import { EstadoEntrega } from '../../common/constants/delivery-enums';

@Entity({ name: 'historial_estado_entrega', schema: 'app' })
export class HistorialEstadoEntrega {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column({ name: 'entrega_id', type: 'uuid' })
    entrega_id: string;

    @Column({
        type: 'enum',
        enum: EstadoEntrega,
    })
    estado: EstadoEntrega;

    @Column({ name: 'cambiado_por_id', type: 'uuid' })
    cambiado_por_id: string;

    @Column({ type: 'text', nullable: true })
    motivo: string;

    @CreateDateColumn({ name: 'creado_en' })
    creado_en: Date;
}

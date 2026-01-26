import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from 'typeorm';
import { EstadoEntrega } from '../../common/constants/delivery-enums';

@Entity({ name: 'historial_estado_entrega', schema: 'app' })
export class HistorialEstadoEntrega {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'entrega_id', type: 'uuid' })
    entregaId: string;

    @Column({
        name: 'estado_anterior',
        type: 'enum',
        enum: EstadoEntrega,
        nullable: true,
    })
    estadoAnterior: EstadoEntrega;

    @Column({
        name: 'estado_nuevo',
        type: 'enum',
        enum: EstadoEntrega,
    })
    estadoNuevo: EstadoEntrega;

    @Column({ name: 'cambiado_por_user_id', type: 'uuid', nullable: true })
    cambiadoPorUserId: string;

    @Column({ type: 'text', nullable: true })
    observaciones: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}

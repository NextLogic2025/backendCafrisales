import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Pedido } from '../../orders/entities/pedido.entity';
import { EstadoPedido } from '../../../common/constants/order-status.enum';

@Entity({ schema: 'app', name: 'historial_estado_pedido' })
export class HistorialEstadoPedido {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @ManyToOne(() => Pedido)
    @JoinColumn({ name: 'pedido_id' })
    pedido: Pedido;

    @Column('uuid')
    pedido_id: string;

    @Column({ type: 'enum', enum: EstadoPedido })
    estado: EstadoPedido;

    @Column('uuid')
    cambiado_por_id: string;

    @Column('text', { nullable: true })
    motivo: string;

    @Column('timestamptz', {
        default: () => 'transaction_timestamp()',
    })
    creado_en: Date;
}

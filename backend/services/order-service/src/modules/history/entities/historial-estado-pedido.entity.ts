import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Pedido } from '../../orders/entities/pedido.entity';

@Entity({ schema: 'app', name: 'historial_estado_pedido' })
export class HistorialEstadoPedido {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Pedido)
    @JoinColumn({ name: 'pedido_id' })
    pedido: Pedido;

    @Column('uuid')
    pedido_id: string;

    @Column({ length: 50, nullable: true })
    estado_anterior: string;

    @Column({ length: 50 })
    estado_nuevo: string;

    @Column('uuid', { nullable: true })
    usuario_id: string;

    @Column('text', { nullable: true })
    razon: string;

    @CreateDateColumn()
    creado_en: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { EstadoPedido } from '../../../common/constants/order-status.enum';
import { ItemPedido } from './item-pedido.entity';

@Entity({ schema: 'app', name: 'pedidos' })
export class Pedido {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 50, unique: true })
    numero_pedido: string;

    @Column('uuid')
    cliente_id: string;

    @Column('uuid', { nullable: true })
    vendedor_id: string;

    @Column('uuid', { nullable: true })
    zona_id: string;

    @Column({
        type: 'varchar',
        length: 50,
        default: EstadoPedido.BORRADOR,
    })
    estado: EstadoPedido;

    @Column('decimal', { precision: 12, scale: 2, default: 0 })
    subtotal: number;

    @Column('decimal', { precision: 12, scale: 2, default: 0 })
    impuestos: number;

    @Column('decimal', { precision: 12, scale: 2, default: 0 })
    total: number;

    @Column('text', { nullable: true })
    notas: string;

    @OneToMany(() => ItemPedido, (item) => item.pedido, { cascade: true })
    items: ItemPedido[];

    @CreateDateColumn()
    creado_en: Date;

    @UpdateDateColumn()
    actualizado_en: Date;
}

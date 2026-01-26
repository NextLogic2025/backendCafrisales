import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { OrigenPrecio } from '../../../common/constants/price-origin.enum';
import { Pedido } from './pedido.entity';

@Entity({ schema: 'app', name: 'items_pedido' })
export class ItemPedido {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Pedido, (pedido) => pedido.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'pedido_id' })
    pedido: Pedido;

    @Column('uuid')
    pedido_id: string;

    @Column('uuid')
    sku_id: string;

    @Column('int')
    cantidad: number;

    @Column('decimal', { precision: 10, scale: 2 })
    precio_unitario: number;

    @Column({
        type: 'varchar',
        length: 20,
        default: OrigenPrecio.CATALOGO,
    })
    origen_precio: OrigenPrecio;

    @Column('decimal', { precision: 12, scale: 2 })
    subtotal: number;

    @CreateDateColumn()
    creado_en: Date;
}

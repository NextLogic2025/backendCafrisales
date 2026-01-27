import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
} from 'typeorm';
import { Pedido } from './pedido.entity';
import { OrigenPrecio } from '../../../common/constants/price-origin.enum';
import { TipoDescuento } from '../../../common/constants/discount-type.enum';

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
    cantidad_solicitada: number;

    @Column({ length: 255 })
    sku_nombre_snapshot: string;

    @Column({ length: 50 })
    sku_codigo_snapshot: string;

    @Column('int')
    sku_peso_gramos_snapshot: number;

    @Column({ length: 50 })
    sku_tipo_empaque_snapshot: string;

    @Column('numeric', { precision: 12, scale: 2 })
    precio_unitario_base: number;

    @Column({ type: 'enum', enum: TipoDescuento, nullable: true })
    descuento_item_tipo: TipoDescuento;

    @Column('numeric', { precision: 12, scale: 2, nullable: true })
    descuento_item_valor: number;

    @Column({ type: 'enum', enum: OrigenPrecio })
    precio_origen: OrigenPrecio;

    @Column('numeric', { precision: 12, scale: 2 })
    precio_unitario_final: number;

    @Column('boolean', { default: false })
    requiere_aprobacion: boolean;

    @Column('uuid', { nullable: true })
    aprobado_por: string;

    @Column('timestamptz', { nullable: true })
    aprobado_en: Date;

    @Column('numeric', { precision: 12, scale: 2 })
    subtotal: number;

    @Column('uuid', { nullable: true })
    creado_por: string;

    @CreateDateColumn()
    creado_en: Date;
}

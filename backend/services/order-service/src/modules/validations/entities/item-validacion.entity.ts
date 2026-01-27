import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ValidacionBodega } from './validacion-bodega.entity';
import { ItemPedido } from '../../orders/entities/item-pedido.entity';
import { EstadoItemResultado } from '../../../common/constants/item-validation.enum';

@Entity({ schema: 'app', name: 'items_validacion_bodega' })
export class ItemValidacion {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => ValidacionBodega, (validacion) => validacion.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'validacion_id' })
    validacion: ValidacionBodega;

    @Column('uuid')
    validacion_id: string;

    @ManyToOne(() => ItemPedido)
    @JoinColumn({ name: 'item_pedido_id' })
    itemPedido: ItemPedido;

    @Column('uuid')
    item_pedido_id: string;

    @Column({ type: 'enum', enum: EstadoItemResultado })
    estado_resultado: EstadoItemResultado;

    @Column('uuid', { nullable: true })
    sku_aprobado_id: string;

    @Column({ length: 255, nullable: true })
    sku_aprobado_nombre_snapshot: string;

    @Column({ length: 50, nullable: true })
    sku_aprobado_codigo_snapshot: string;

    @Column('int', { nullable: true })
    cantidad_aprobada: number;

    @Column('text')
    motivo: string;

    @Column('timestamptz', {
        default: () => 'transaction_timestamp()',
    })
    creado_en: Date;
}

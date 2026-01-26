import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { ValidacionBodega } from './validacion-bodega.entity';
import { ItemPedido } from '../../orders/entities/item-pedido.entity';

@Entity({ schema: 'app', name: 'items_validacion' })
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

    @Column('int', { nullable: true })
    cantidad_disponible: number;

    @Column('int', { nullable: true })
    cantidad_ajustada: number;

    @Column('text', { nullable: true })
    motivo_ajuste: string;

    @Column('boolean', { default: true })
    aprobado: boolean;

    @CreateDateColumn()
    creado_en: Date;
}

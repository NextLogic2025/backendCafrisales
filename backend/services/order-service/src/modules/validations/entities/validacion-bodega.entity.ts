import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn } from 'typeorm';
import { Pedido } from '../../orders/entities/pedido.entity';
import { ItemValidacion } from './item-validacion.entity';

@Entity({ schema: 'app', name: 'validaciones_bodega' })
export class ValidacionBodega {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Pedido)
    @JoinColumn({ name: 'pedido_id' })
    pedido: Pedido;

    @Column('uuid')
    pedido_id: string;

    @Column('uuid')
    bodeguero_id: string;

    @Column('int', { default: 1 })
    version: number;

    @Column({ length: 50, default: 'pendiente' })
    estado: string;

    @Column('text', { nullable: true })
    observaciones: string;

    @OneToMany(() => ItemValidacion, (item) => item.validacion, { cascade: true })
    items: ItemValidacion[];

    @CreateDateColumn()
    creado_en: Date;
}

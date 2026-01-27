import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    OneToMany,
} from 'typeorm';
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
    validado_por_id: string;

    @Column('int')
    numero_version: number;

    @Column('timestamptz', {
        default: () => 'transaction_timestamp()',
    })
    validado_en: Date;

    @Column('boolean', { default: false })
    requiere_aceptacion_cliente: boolean;

    @Column('text', { nullable: true })
    motivo_general: string;

    @OneToMany(() => ItemValidacion, (item) => item.validacion, { cascade: true })
    items: ItemValidacion[];
}

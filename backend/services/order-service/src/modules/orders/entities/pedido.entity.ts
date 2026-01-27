import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { EstadoPedido } from '../../../common/constants/order-status.enum';
import { OrigenCreacion } from '../../../common/constants/creation-source.enum';
import { MetodoPago } from '../../../common/constants/payment-method.enum';
import { TipoDescuento } from '../../../common/constants/discount-type.enum';
import { ItemPedido } from './item-pedido.entity';
import { ValidacionBodega } from '../../validations/entities/validacion-bodega.entity';
import { HistorialEstadoPedido } from '../../history/entities/historial-estado-pedido.entity';

@Entity({ schema: 'app', name: 'pedidos' })
export class Pedido {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 50, unique: true })
    numero_pedido: string;

    @Column('uuid')
    cliente_id: string;

    @Column('uuid')
    zona_id: string;

    @Column('uuid')
    creado_por_id: string;

    @Column({ type: 'enum', enum: OrigenCreacion })
    origen: OrigenCreacion;

    @Column({
        type: 'enum',
        enum: EstadoPedido,
        default: EstadoPedido.PENDIENTE_VALIDACION,
    })
    estado: EstadoPedido;

    @Column({ type: 'enum', enum: MetodoPago })
    metodo_pago: MetodoPago;

    @Column('numeric', { precision: 12, scale: 2 })
    subtotal: number;

    @Column({ type: 'enum', enum: TipoDescuento, nullable: true })
    descuento_pedido_tipo: TipoDescuento;

    @Column('numeric', { precision: 12, scale: 2, nullable: true })
    descuento_pedido_valor: number;

    @Column('numeric', { precision: 12, scale: 2 })
    impuesto: number;

    @Column('numeric', { precision: 12, scale: 2 })
    total: number;

    @Column('text', { nullable: true })
    notas: string;

    @Column('date', { nullable: true })
    fecha_entrega_sugerida: string;

    @OneToMany(() => ItemPedido, (item) => item.pedido, { cascade: true })
    items: ItemPedido[];

    @OneToMany(() => ValidacionBodega, (validacion) => validacion.pedido)
    validaciones: ValidacionBodega[];

    @OneToMany(() => HistorialEstadoPedido, (historial) => historial.pedido)
    historial: HistorialEstadoPedido[];

    @Column('uuid', { nullable: true })
    creado_por: string;

    @Column('uuid', { nullable: true })
    actualizado_por: string;

    @Column('int', { default: 1 })
    version: number;

    @CreateDateColumn()
    creado_en: Date;

    @UpdateDateColumn()
    actualizado_en: Date;
}

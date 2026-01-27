import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity({ schema: 'app', name: 'cancelaciones_pedido' })
export class CancelacionPedido {
    @PrimaryColumn('uuid')
    pedido_id: string;

    @Column('uuid')
    cancelado_por_id: string;

    @Column('text')
    motivo: string;

    @Column('timestamptz', {
        default: () => 'transaction_timestamp()',
    })
    cancelado_en: Date;
}

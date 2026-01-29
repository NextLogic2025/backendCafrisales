import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { EstadoCredito } from '../../../common/constants/credit-status.enum';
import { OrigenCredito } from '../../../common/constants/credit-origin.enum';
import { PagoCredito } from '../../payments/entities/pago-credito.entity';

@Entity({ schema: 'app', name: 'aprobaciones_credito' })
export class AprobacionCredito {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid', { unique: true })
    pedido_id: string;

    @Column('uuid')
    cliente_id: string;

    @Column('uuid')
    aprobado_por_vendedor_id: string;

    @Column({
        type: 'enum',
        enum: OrigenCredito,
        enumName: 'origen_credito',
        default: OrigenCredito.VENDEDOR,
    })
    origen: OrigenCredito;

    @Column('decimal', { precision: 12, scale: 2 })
    monto_aprobado: number;

    @Column({ type: 'char', length: 3, default: 'USD' })
    moneda: string;

    @Column('int')
    plazo_dias: number;

    @Column('date')
    fecha_aprobacion: Date;

    @Column('date')
    fecha_vencimiento: Date;

    @Column({
        type: 'enum',
        enum: EstadoCredito,
        enumName: 'estado_credito',
        default: EstadoCredito.ACTIVO,
    })
    estado: EstadoCredito;

    @Column('text', { nullable: true })
    notas: string;

    @OneToMany(() => PagoCredito, (pago) => pago.aprobacion, { cascade: true })
    pagos: PagoCredito[];

    @CreateDateColumn()
    creado_en: Date;

    @UpdateDateColumn()
    actualizado_en: Date;

    @Column('uuid', { nullable: true })
    creado_por: string;

    @Column('uuid', { nullable: true })
    actualizado_por: string;

    @Column('int', { default: 1 })
    version: number;
}

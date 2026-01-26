import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { AprobacionCredito } from '../../credits/entities/aprobacion-credito.entity';

@Entity({ schema: 'app', name: 'pagos_credito' })
export class PagoCredito {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => AprobacionCredito, (aprobacion) => aprobacion.pagos, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'aprobacion_credito_id' })
    aprobacion: AprobacionCredito;

    @Column('uuid')
    aprobacion_credito_id: string;

    @Column('decimal', { precision: 12, scale: 2 })
    monto_pago: number;

    @Column({ type: 'char', length: 3, default: 'USD' })
    moneda: string;

    @Column('date')
    fecha_pago: Date;

    @Column('uuid')
    registrado_por_id: string;

    @Column({ length: 30, default: 'manual' })
    metodo_registro: string;

    @Column({ length: 80, nullable: true })
    referencia: string;

    @Column('text', { nullable: true })
    notas: string;

    @CreateDateColumn()
    creado_en: Date;
}

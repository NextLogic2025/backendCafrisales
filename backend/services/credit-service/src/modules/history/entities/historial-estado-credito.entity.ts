import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { AprobacionCredito } from '../../credits/entities/aprobacion-credito.entity';
import { EstadoCredito } from '../../../common/constants/credit-status.enum';

@Entity({ schema: 'app', name: 'historial_estado_credito' })
export class HistorialEstadoCredito {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @ManyToOne(() => AprobacionCredito)
    @JoinColumn({ name: 'aprobacion_credito_id' })
    aprobacion: AprobacionCredito;

    @Column('uuid')
    aprobacion_credito_id: string;

    @Column({
        type: 'varchar',
        length: 20,
    })
    estado: EstadoCredito;

    @Column('uuid')
    cambiado_por_id: string;

    @Column('text', { nullable: true })
    motivo: string;

    @CreateDateColumn()
    creado_en: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { ValidacionBodega } from '../../validations/entities/validacion-bodega.entity';
import { AccionClienteAjuste } from '../../../common/constants/client-action.enum';

@Entity({ schema: 'app', name: 'acciones_cliente_validacion' })
export class AccionClienteValidacion {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => ValidacionBodega)
    @JoinColumn({ name: 'validacion_id' })
    validacion: ValidacionBodega;

    @Column('uuid')
    validacion_id: string;

    @Column('uuid')
    pedido_id: string;

    @Column('uuid')
    cliente_id: string;

    @Column({ type: 'enum', enum: AccionClienteAjuste })
    accion: AccionClienteAjuste;

    @Column('text', { nullable: true })
    comentario: string;

    @CreateDateColumn()
    creado_en: Date;
}

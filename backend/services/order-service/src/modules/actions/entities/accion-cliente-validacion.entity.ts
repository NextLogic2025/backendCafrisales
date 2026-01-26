import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { ValidacionBodega } from '../../validations/entities/validacion-bodega.entity';

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
    cliente_id: string;

    @Column({ length: 20 })
    accion: string; // 'aceptar' | 'rechazar'

    @Column('text', { nullable: true })
    comentario: string;

    @CreateDateColumn()
    creado_en: Date;
}

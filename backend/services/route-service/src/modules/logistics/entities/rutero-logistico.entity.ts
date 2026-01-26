import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';
import { EstadoRutero } from '../../../common/constants/route-enums';
import { ParadaRuteroLogistico } from './parada-rutero-logistico.entity';

@Entity({ schema: 'app', name: 'ruteros_logisticos' })
@Unique(['fecha_rutero', 'zona_id', 'vehiculo_id'])
export class RuteroLogistico {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('date')
    fecha_rutero: Date;

    @Column('uuid')
    zona_id: string;

    @Column('uuid')
    vehiculo_id: string;

    @Column('uuid')
    transportista_id: string;

    @Column('uuid')
    creado_por_supervisor_id: string;

    @Column({
        type: 'varchar',
        length: 20,
        default: EstadoRutero.BORRADOR,
    })
    estado: EstadoRutero;

    @OneToMany(() => ParadaRuteroLogistico, (parada) => parada.rutero, { cascade: true })
    paradas: ParadaRuteroLogistico[];

    @Column('timestamptz', { nullable: true })
    publicado_en: Date;
    @Column('uuid', { nullable: true })
    publicado_por: string;

    @Column('timestamptz', { nullable: true })
    iniciado_en: Date;
    @Column('uuid', { nullable: true })
    iniciado_por: string;

    @Column('timestamptz', { nullable: true })
    completado_en: Date;
    @Column('uuid', { nullable: true })
    completado_por: string;

    @Column('timestamptz', { nullable: true })
    cancelado_en: Date;
    @Column('uuid', { nullable: true })
    cancelado_por: string;

    @Column('text', { nullable: true })
    cancelado_motivo: string;

    @CreateDateColumn()
    creado_en: Date;

    @UpdateDateColumn()
    actualizado_en: Date;

    @Column('int', { default: 1 })
    version: number;
}

import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';
import { EstadoRutero } from '../../../common/constants/route-enums';
import { ParadaRuteroComercial } from './parada-rutero-comercial.entity';

@Entity({ schema: 'app', name: 'ruteros_comerciales' })
@Unique(['fecha_rutero', 'vendedor_id'])
export class RuteroComercial {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('date')
    fecha_rutero: Date;

    @Column('uuid')
    zona_id: string;

    @Column('uuid')
    vendedor_id: string;

    @Column('uuid')
    creado_por_supervisor_id: string;

    @Column({
        type: 'enum',
        enum: EstadoRutero,
        enumName: 'estado_rutero',
        default: EstadoRutero.BORRADOR,
    })
    estado: EstadoRutero;

    @OneToMany(() => ParadaRuteroComercial, (parada) => parada.rutero, { cascade: true })
    paradas: ParadaRuteroComercial[];

    // Auditoría extendida
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

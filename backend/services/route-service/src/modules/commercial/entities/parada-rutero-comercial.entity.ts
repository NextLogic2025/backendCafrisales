import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Unique } from 'typeorm';
import { RuteroComercial } from './rutero-comercial.entity';
import { ResultadoVisita } from '../../../common/constants/route-enums';

@Entity({ schema: 'app', name: 'paradas_rutero_comercial' })
@Unique(['rutero_id', 'orden_visita'])
@Unique(['rutero_id', 'cliente_id'])
export class ParadaRuteroComercial {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => RuteroComercial, (rutero) => rutero.paradas, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'rutero_id' })
    rutero: RuteroComercial;

    @Column('uuid')
    rutero_id: string;

    @Column('uuid')
    cliente_id: string;

    @Column('int')
    orden_visita: number;

    @Column('text', { nullable: true })
    objetivo: string;

    @Column('timestamptz', { nullable: true })
    checkin_en: Date;

    @Column('timestamptz', { nullable: true })
    checkout_en: Date;

    @Column({
        type: 'varchar',
        length: 20,
        nullable: true,
    })
    resultado: ResultadoVisita;

    @Column('text', { nullable: true })
    notas: string;

    @CreateDateColumn()
    creado_en: Date;
}

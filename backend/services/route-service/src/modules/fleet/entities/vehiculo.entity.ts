import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { EstadoVehiculo } from '../../../common/constants/route-enums';

@Entity({ schema: 'app', name: 'vehiculos' })
export class Vehiculo {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true, length: 20 })
    placa: string;

    @Column({ length: 100, nullable: true })
    modelo: string;

    @Column('int', { nullable: true })
    capacidad_kg: number;

    @Column({
        type: 'varchar',
        length: 20,
        default: EstadoVehiculo.DISPONIBLE,
    })
    estado: EstadoVehiculo;

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

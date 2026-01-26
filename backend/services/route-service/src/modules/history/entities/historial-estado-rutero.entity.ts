import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { EstadoRutero, TipoRutero } from '../../../common/constants/route-enums';

@Entity({ schema: 'app', name: 'historial_estado_rutero' })
export class HistorialEstadoRutero {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column({
        type: 'varchar',
        length: 20,
    })
    tipo: TipoRutero;

    @Column('uuid')
    rutero_id: string;

    @Column({
        type: 'varchar',
        length: 20,
    })
    estado: EstadoRutero;

    @Column('uuid')
    cambiado_por_id: string;

    @Column('text', { nullable: true })
    motivo: string;

    @CreateDateColumn()
    creado_en: Date;
}

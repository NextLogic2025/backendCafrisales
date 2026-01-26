import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Unique } from 'typeorm';
import { RuteroLogistico } from './rutero-logistico.entity';

@Entity({ schema: 'app', name: 'paradas_rutero_logistico' })
@Unique(['rutero_id', 'orden_entrega'])
@Unique(['rutero_id', 'pedido_id'])
export class ParadaRuteroLogistico {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => RuteroLogistico, (rutero) => rutero.paradas, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'rutero_id' })
    rutero: RuteroLogistico;

    @Column('uuid')
    rutero_id: string;

    @Column('uuid')
    pedido_id: string;

    @Column('int')
    orden_entrega: number;

    @Column('timestamptz', { nullable: true })
    preparado_en: Date;

    @Column('uuid', { nullable: true })
    preparado_por: string;

    @CreateDateColumn()
    creado_en: Date;
}

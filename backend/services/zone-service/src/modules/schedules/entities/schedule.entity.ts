import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Unique } from 'typeorm';
import { Zone } from '../../zones/entities/zone.entity';

@Entity('horarios_zona', { schema: 'app' })
@Unique(['zona', 'diaSemana'])
export class Schedule {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Zone, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'zona_id' })
    zona: Zone;

    @Column({ name: 'dia_semana' })
    diaSemana: number; // 0=Sunday, 6=Saturday

    @Column({ name: 'entregas_habilitadas', default: true })
    entregasHabilitadas: boolean;

    @Column({ name: 'visitas_habilitadas', default: true })
    visitasHabilitadas: boolean;

    @CreateDateColumn({ name: 'creado_en' })
    creadoEn: Date;

    @Column({ name: 'creado_por', type: 'uuid', nullable: true })
    creadoPor: string;
}

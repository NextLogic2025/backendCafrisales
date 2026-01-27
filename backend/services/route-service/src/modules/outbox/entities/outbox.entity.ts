import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ schema: 'app', name: 'outbox_eventos' })
export class Outbox {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('text')
    agregado: string;

    @Column('text')
    tipo_evento: string;

    @Column('text')
    clave_agregado: string;

    @Column('jsonb')
    payload: any;

    @CreateDateColumn()
    creado_en: Date;

    @Column({ type: 'timestamp', nullable: true })
    procesado_en: Date;

    @Column('int', { default: 0 })
    intentos: number;
}

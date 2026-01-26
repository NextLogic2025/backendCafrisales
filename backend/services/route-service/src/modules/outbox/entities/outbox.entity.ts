import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ schema: 'app', name: 'outbox' })
export class Outbox {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 100 })
    tipo_evento: string;

    @Column({ length: 255, nullable: true })
    clave_agregado: string;

    @Column('jsonb')
    payload: any;

    @Column({ length: 50, nullable: true })
    agregado: string;

    @Column({ type: 'timestamp', nullable: true })
    procesado_en: Date;

    @Column('text', { nullable: true })
    error: string;

    @CreateDateColumn()
    creado_en: Date;
}

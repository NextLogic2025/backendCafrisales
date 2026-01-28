import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ schema: 'app', name: 'outbox_eventos' })
export class Outbox {
    @PrimaryColumn('uuid', { name: 'id', default: () => 'gen_random_uuid()' })
    id: string;

    @Column({ type: 'text' })
    agregado: string;

    @Column({ name: 'tipo_evento', type: 'text' })
    tipoEvento: string;

    @Column({ name: 'clave_agregado', type: 'text' })
    claveAgregado: string;

    @Column({ type: 'jsonb' })
    payload: Record<string, any>;

    @Column({ name: 'creado_en', type: 'timestamptz', default: () => 'transaction_timestamp()' })
    creadoEn: Date;

    @Column({ name: 'procesado_en', type: 'timestamptz', nullable: true })
    procesadoEn: Date;

    @Column({ type: 'int', default: 0 })
    intentos: number;
}

import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'supervisores', schema: 'app' })
export class Supervisor {
  @PrimaryColumn('uuid')
  usuario_id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  codigo_empleado: string;

  @Column({ type: 'timestamptz', default: () => 'transaction_timestamp()', name: 'creado_en' })
  creado_en: Date;
}

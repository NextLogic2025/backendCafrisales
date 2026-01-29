import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { Usuario } from '../../users/entities/usuario.entity';

@Entity({ name: 'bodegueros', schema: 'app' })
export class Bodeguero {
  @PrimaryColumn('uuid')
  usuario_id: string;

  @OneToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ type: 'varchar', length: 50, unique: true })
  codigo_empleado: string;

  @Column({ type: 'timestamptz', default: () => 'transaction_timestamp()', name: 'creado_en' })
  creado_en: Date;
}

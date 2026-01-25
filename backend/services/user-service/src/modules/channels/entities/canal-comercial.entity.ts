import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'canales_comerciales', schema: 'app' })
export class CanalComercial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;
}

import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'supervisores', schema: 'app' })
export class Supervisor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;
}

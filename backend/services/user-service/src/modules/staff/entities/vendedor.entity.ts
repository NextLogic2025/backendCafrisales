import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'vendedores', schema: 'app' })
export class Vendedor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;
}

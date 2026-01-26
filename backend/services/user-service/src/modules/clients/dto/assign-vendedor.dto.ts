import { IsNotEmpty, IsUUID } from 'class-validator';

export class AssignVendedorDto {
  @IsUUID()
  @IsNotEmpty()
  vendedor_id: string;
}

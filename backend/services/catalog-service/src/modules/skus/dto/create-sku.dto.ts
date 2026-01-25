import { IsString, IsUUID, IsInt, Min } from 'class-validator';

export class CreateSkuDto {
  @IsUUID()
  producto_id: string;

  @IsString()
  codigo_sku: string;

  @IsString()
  nombre: string;

  @IsInt()
  @Min(1)
  peso_gramos: number;
}

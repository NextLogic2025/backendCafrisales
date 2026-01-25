import { IsString, IsUUID, MaxLength, IsOptional } from 'class-validator';

export class CreateProductDto {
  @IsUUID()
  categoria_id: string;

  @IsString()
  @MaxLength(255)
  nombre: string;

  @IsString()
  @MaxLength(255)
  slug: string;

  @IsOptional()
  descripcion?: string;
}

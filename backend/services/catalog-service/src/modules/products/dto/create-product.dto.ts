import { IsString, IsUUID, MaxLength, IsOptional, IsBoolean } from 'class-validator';

export class CreateProductDto {
  @IsUUID()
  categoria_id: string;

  @IsString()
  @MaxLength(255)
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  slug?: string;

  @IsOptional()
  descripcion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  img_url?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

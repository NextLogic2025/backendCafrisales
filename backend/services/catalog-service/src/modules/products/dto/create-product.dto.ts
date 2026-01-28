import { IsString, IsUUID, MaxLength, IsOptional, IsBoolean, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProductDto {
  @IsUUID()
  categoria_id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  slug?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  descripcion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  img_url?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

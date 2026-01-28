import { IsString, IsNotEmpty, IsOptional, IsBoolean, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateChannelDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  @Matches(/^[a-z0-9_-]+$/, { message: 'codigo debe ser alfanumérico lowercase' })
  @Transform(({ value }) => value?.trim().toLowerCase())
  codigo: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  @Transform(({ value }) => value?.trim())
  nombre: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  descripcion?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}

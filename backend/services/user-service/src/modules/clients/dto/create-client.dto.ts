import { IsNotEmpty, IsOptional, IsUUID, IsNumber, MaxLength, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateClientDto {
  @IsUUID()
  @IsNotEmpty()
  usuario_id: string;

  @IsUUID()
  @IsNotEmpty()
  canal_id: string;

  @IsNotEmpty()
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  nombre_comercial: string;

  @IsOptional()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  ruc?: string;

  @IsUUID()
  @IsNotEmpty()
  zona_id: string;

  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  direccion: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitud?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitud?: number;

  @IsOptional()
  @IsUUID()
  vendedor_asignado_id?: string;
}

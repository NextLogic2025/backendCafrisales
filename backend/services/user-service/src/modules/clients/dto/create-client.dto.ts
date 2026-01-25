import { IsNotEmpty, IsOptional, IsUUID, IsNumber } from 'class-validator';

export class CreateClientDto {
  @IsUUID()
  @IsNotEmpty()
  usuario_id: string;

  @IsUUID()
  @IsNotEmpty()
  canal_id: string;

  @IsNotEmpty()
  nombre_comercial: string;

  @IsOptional()
  ruc?: string;

  @IsUUID()
  @IsNotEmpty()
  zona_id: string;

  @IsNotEmpty()
  direccion: string;

  @IsOptional()
  @IsNumber()
  latitud?: number;

  @IsOptional()
  @IsNumber()
  longitud?: number;

  @IsOptional()
  @IsUUID()
  vendedor_asignado_id?: string;
}

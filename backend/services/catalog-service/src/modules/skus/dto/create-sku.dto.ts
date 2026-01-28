import { IsString, IsUUID, IsInt, Min, IsOptional, IsBoolean, MaxLength, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateSkuDto {
  @IsUUID()
  producto_id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  codigo_sku: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  nombre: string;

  @IsInt()
  @Min(1)
  peso_gramos: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  tipo_empaque?: string;

  @IsOptional()
  @IsBoolean()
  requiere_refrigeracion?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  unidades_por_paquete?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

import { IsString, IsUUID, IsInt, Min, IsOptional, IsBoolean, MaxLength } from 'class-validator';

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

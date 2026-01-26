import { IsString, IsUUID, IsOptional, IsNumber, IsInt, Min, MaxLength, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

class SkuDataDto {
    @IsString()
    @MaxLength(50)
    codigo_sku: string;

    @IsString()
    @MaxLength(255)
    nombre: string;

    @IsInt()
    @Min(1)
    peso_gramos: number;

    @IsOptional()
    @IsString()
    tipo_empaque?: string;

    @IsOptional()
    @IsBoolean()
    requiere_refrigeracion?: boolean;

    @IsOptional()
    @IsInt()
    @Min(1)
    unidades_por_paquete?: number;
}

class PriceDataDto {
    @IsNumber()
    @Min(0)
    precio: number;

    @IsOptional()
    @IsString()
    @MaxLength(3)
    moneda?: string = 'USD';
}

export class CreateCompleteProductDto {
    // Category info - can be UUID or name to create/find
    @IsOptional()
    @IsUUID()
    categoria_id?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    categoria_nombre?: string;

    @IsOptional()
    @IsString()
    @MaxLength(120)
    categoria_slug?: string;

    // Product info
    @IsString()
    @MaxLength(255)
    nombre: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    slug?: string;

    @IsOptional()
    @IsString()
    descripcion?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    img_url?: string;

    // SKU info
    @ValidateNested()
    @Type(() => SkuDataDto)
    sku: SkuDataDto;

    // Price info
    @ValidateNested()
    @Type(() => PriceDataDto)
    precio: PriceDataDto;
}

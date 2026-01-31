import { Transform, Type } from 'class-transformer';
import {
    IsArray,
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
    IsUrl,
    IsUUID,
    MaxLength,
    ValidateNested,
    ArrayMinSize,
    Min,
    Max,
} from 'class-validator';
import { TipoEvidencia } from '../../common/constants/delivery-enums';

export class CreateDeliveryStopDto {
    @IsUUID('4', { message: 'pedido_id debe ser un UUID v4 válido' })
    pedido_id: string;

    @IsNumber({}, { message: 'orden debe ser un número' })
    @Min(1, { message: 'orden debe ser al menos 1' })
    orden: number;
}

export class CreateDeliveriesBatchDto {
    @IsUUID('4', { message: 'rutero_logistico_id debe ser un UUID v4 válido' })
    rutero_logistico_id: string;

    @IsUUID('4', { message: 'transportista_id debe ser un UUID v4 válido' })
    transportista_id: string;

    @IsArray({ message: 'paradas debe ser un array' })
    @ArrayMinSize(1, { message: 'Se requiere al menos una parada' })
    @ValidateNested({ each: true })
    @Type(() => CreateDeliveryStopDto)
    paradas: CreateDeliveryStopDto[];
}

export class EvidenceInputDto {
    @IsEnum(TipoEvidencia, { message: 'tipo debe ser uno de: foto, firma, documento, audio, otro' })
    tipo: TipoEvidencia;

    @IsUrl({}, { message: 'url debe ser una URL válida' })
    @MaxLength(2000, { message: 'url no debe exceder 2000 caracteres' })
    url: string;

    @IsOptional()
    @IsString({ message: 'mime_type debe ser un string' })
    @MaxLength(100, { message: 'mime_type no debe exceder 100 caracteres' })
    mime_type?: string;

    @IsOptional()
    @IsString({ message: 'hash_archivo debe ser un string' })
    @MaxLength(128, { message: 'hash_archivo no debe exceder 128 caracteres' })
    hash_archivo?: string;

    @IsOptional()
    @IsNumber({}, { message: 'tamano_bytes debe ser un número' })
    @Min(0, { message: 'tamano_bytes no puede ser negativo' })
    tamano_bytes?: number;

    @IsOptional()
    @IsString({ message: 'descripcion debe ser un string' })
    @MaxLength(500, { message: 'descripcion no debe exceder 500 caracteres' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    descripcion?: string;

    @IsOptional()
    meta?: Record<string, unknown>;
}

export class CompleteDeliveryDto {
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => EvidenceInputDto)
    evidencias?: EvidenceInputDto[];

    @IsOptional()
    @IsNumber({}, { message: 'latitud debe ser un número' })
    @Min(-90, { message: 'latitud debe estar entre -90 y 90' })
    @Max(90, { message: 'latitud debe estar entre -90 y 90' })
    latitud?: number;

    @IsOptional()
    @IsNumber({}, { message: 'longitud debe ser un número' })
    @Min(-180, { message: 'longitud debe estar entre -180 y 180' })
    @Max(180, { message: 'longitud debe estar entre -180 y 180' })
    longitud?: number;

    @IsOptional()
    @IsString({ message: 'observaciones debe ser un string' })
    @MaxLength(1000, { message: 'observaciones no debe exceder 1000 caracteres' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    observaciones?: string;
}

export class CompletePartialDeliveryDto extends CompleteDeliveryDto {
    @IsString({ message: 'motivo_parcial es requerido' })
    @MaxLength(500, { message: 'motivo_parcial no debe exceder 500 caracteres' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    motivo_parcial: string;
}

export class NoDeliveryDto extends CompleteDeliveryDto {
    @IsString({ message: 'motivo_no_entrega es requerido' })
    @MaxLength(500, { message: 'motivo_no_entrega no debe exceder 500 caracteres' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    motivo_no_entrega: string;
}

export class CancelDeliveryDto {
    @IsString({ message: 'motivo es requerido' })
    @MaxLength(500, { message: 'motivo no debe exceder 500 caracteres' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    motivo: string;
}

export class LocationUpdateDto {
    @IsNumber({}, { message: 'latitud debe ser un número' })
    @Min(-90, { message: 'latitud debe estar entre -90 y 90' })
    @Max(90, { message: 'latitud debe estar entre -90 y 90' })
    latitud: number;

    @IsNumber({}, { message: 'longitud debe ser un número' })
    @Min(-180, { message: 'longitud debe estar entre -180 y 180' })
    @Max(180, { message: 'longitud debe estar entre -180 y 180' })
    longitud: number;
}

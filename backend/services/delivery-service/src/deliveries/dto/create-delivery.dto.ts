import { Type } from 'class-transformer';
import {
    IsArray,
    IsDateString,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    ValidateNested,
    ArrayMinSize,
    Min,
    Max,
} from 'class-validator';
import { TipoEvidencia } from '../../common/constants/delivery-enums';

export class CreateDeliveryStopDto {
    @IsUUID()
    pedido_id: string;

    @IsNumber()
    @Min(1)
    orden: number;
}

export class CreateDeliveriesBatchDto {
    @IsUUID()
    rutero_logistico_id: string;

    @IsUUID()
    transportista_id: string;

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => CreateDeliveryStopDto)
    paradas: CreateDeliveryStopDto[];
}

export class EvidenceInputDto {
    @IsString()
    tipo: TipoEvidencia;

    @IsString()
    url: string;

    @IsOptional()
    @IsString()
    mime_type?: string;

    @IsOptional()
    @IsString()
    hash_archivo?: string;

    @IsOptional()
    @IsNumber()
    tamano_bytes?: number;

    @IsOptional()
    @IsString()
    descripcion?: string;

    @IsOptional()
    meta?: any;
}

export class CompleteDeliveryDto {
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => EvidenceInputDto)
    evidencias?: EvidenceInputDto[];

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
    @IsString()
    observaciones?: string;
}

export class CompletePartialDeliveryDto extends CompleteDeliveryDto {
    @IsString()
    motivo_parcial: string;
}

export class NoDeliveryDto extends CompleteDeliveryDto {
    @IsString()
    motivo_no_entrega: string;
}

export class CancelDeliveryDto {
    @IsString()
    motivo: string;
}

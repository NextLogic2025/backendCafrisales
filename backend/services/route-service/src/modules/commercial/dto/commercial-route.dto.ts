import { Type } from 'class-transformer';
import { IsUUID, IsDateString, IsString, IsOptional, IsInt, Min, IsEnum, ValidateNested, IsArray, ArrayMinSize } from 'class-validator';
import { ResultadoVisita } from '../../../common/constants/route-enums';

export class CreateCommercialStopDto {
    @IsUUID()
    cliente_id: string;

    @IsInt()
    @Min(1)
    orden_visita: number;

    @IsString()
    @IsOptional()
    objetivo?: string;
}

export class CreateCommercialRouteDto {
    @IsDateString()
    fecha_rutero: string;

    @IsUUID()
    zona_id: string;

    @IsUUID()
    vendedor_id: string;

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => CreateCommercialStopDto)
    paradas: CreateCommercialStopDto[];
}

export class AddVisitDto {
    @IsUUID()
    cliente_id: string;

    @IsInt()
    @Min(1)
    orden_visita: number;

    @IsString()
    @IsOptional()
    objetivo?: string;
}

export class UpdateVisitResultDto {
    @IsEnum(ResultadoVisita)
    resultado: ResultadoVisita;

    @IsString()
    @IsOptional()
    notas?: string;
}

export class CancelRuteroDto {
    @IsString()
    @IsOptional()
    motivo?: string;
}

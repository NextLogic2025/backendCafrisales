import { Type, Transform } from 'class-transformer';
import {
    IsUUID,
    IsDateString,
    IsString,
    IsOptional,
    IsInt,
    Min,
    Max,
    IsEnum,
    ValidateNested,
    IsArray,
    ArrayMinSize,
    MaxLength,
} from 'class-validator';
import { ResultadoVisita } from '../../../common/constants/route-enums';

export class CreateCommercialStopDto {
    @IsUUID('4', { message: 'cliente_id debe ser un UUID válido' })
    cliente_id: string;

    @IsInt({ message: 'orden_visita debe ser un número entero' })
    @Min(1, { message: 'orden_visita debe ser al menos 1' })
    @Max(999, { message: 'orden_visita no puede exceder 999' })
    orden_visita: number;

    @IsString({ message: 'objetivo debe ser texto' })
    @MaxLength(2000, { message: 'objetivo no puede exceder 2000 caracteres' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @IsOptional()
    objetivo?: string;
}

export class CreateCommercialRouteDto {
    @IsDateString({}, { message: 'fecha_rutero debe ser una fecha ISO válida' })
    fecha_rutero: string;

    @IsUUID('4', { message: 'zona_id debe ser un UUID válido' })
    zona_id: string;

    @IsUUID('4', { message: 'vendedor_id debe ser un UUID válido' })
    vendedor_id: string;

    @IsArray({ message: 'paradas debe ser un arreglo' })
    @ArrayMinSize(1, { message: 'Debe incluir al menos una parada' })
    @ValidateNested({ each: true })
    @Type(() => CreateCommercialStopDto)
    paradas: CreateCommercialStopDto[];
}

export class AddVisitDto {
    @IsUUID('4', { message: 'cliente_id debe ser un UUID válido' })
    cliente_id: string;

    @IsInt({ message: 'orden_visita debe ser un número entero' })
    @Min(1, { message: 'orden_visita debe ser al menos 1' })
    @Max(999, { message: 'orden_visita no puede exceder 999' })
    orden_visita: number;

    @IsString({ message: 'objetivo debe ser texto' })
    @MaxLength(2000, { message: 'objetivo no puede exceder 2000 caracteres' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @IsOptional()
    objetivo?: string;
}

export class UpdateVisitResultDto {
    @IsEnum(ResultadoVisita, {
        message: `resultado debe ser uno de: ${Object.values(ResultadoVisita).join(', ')}`,
    })
    resultado: ResultadoVisita;

    @IsString({ message: 'notas debe ser texto' })
    @MaxLength(2000, { message: 'notas no puede exceder 2000 caracteres' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @IsOptional()
    notas?: string;
}

export class CancelRuteroDto {
    @IsString({ message: 'motivo debe ser texto' })
    @MaxLength(1000, { message: 'motivo no puede exceder 1000 caracteres' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @IsOptional()
    motivo?: string;
}

import { Type, Transform } from 'class-transformer';
import {
    IsUUID,
    IsDateString,
    IsInt,
    Min,
    Max,
    ValidateNested,
    IsArray,
    ArrayMinSize,
    IsString,
    IsOptional,
    MaxLength,
} from 'class-validator';

export class CreateLogisticStopDto {
    @IsUUID('4', { message: 'pedido_id debe ser un UUID válido' })
    pedido_id: string;

    @IsInt({ message: 'orden_entrega debe ser un número entero' })
    @Min(1, { message: 'orden_entrega debe ser al menos 1' })
    @Max(999, { message: 'orden_entrega no puede exceder 999' })
    orden_entrega: number;
}

export class CreateLogisticRouteDto {
    @IsDateString({}, { message: 'fecha_rutero debe ser una fecha ISO válida' })
    fecha_rutero: string;

    @IsUUID('4', { message: 'zona_id debe ser un UUID válido' })
    zona_id: string;

    @IsUUID('4', { message: 'vehiculo_id debe ser un UUID válido' })
    vehiculo_id: string;

    @IsUUID('4', { message: 'transportista_id debe ser un UUID válido' })
    transportista_id: string;

    @IsArray({ message: 'paradas debe ser un arreglo' })
    @ArrayMinSize(1, { message: 'Debe incluir al menos un pedido' })
    @ValidateNested({ each: true })
    @Type(() => CreateLogisticStopDto)
    paradas: CreateLogisticStopDto[];
}

export class AddOrderDto {
    @IsUUID('4', { message: 'pedido_id debe ser un UUID válido' })
    pedido_id: string;

    @IsInt({ message: 'orden_entrega debe ser un número entero' })
    @Min(1, { message: 'orden_entrega debe ser al menos 1' })
    @Max(999, { message: 'orden_entrega no puede exceder 999' })
    orden_entrega: number;
}

export class CancelRuteroDto {
    @IsString({ message: 'motivo debe ser texto' })
    @MaxLength(1000, { message: 'motivo no puede exceder 1000 caracteres' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @IsOptional()
    motivo?: string;
}

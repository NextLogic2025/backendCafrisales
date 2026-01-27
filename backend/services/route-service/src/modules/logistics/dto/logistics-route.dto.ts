import { Type } from 'class-transformer';
import { IsUUID, IsDateString, IsInt, Min, ValidateNested, IsArray, ArrayMinSize, IsString, IsOptional } from 'class-validator';

export class CreateLogisticStopDto {
    @IsUUID()
    pedido_id: string;

    @IsInt()
    @Min(1)
    orden_entrega: number;
}

export class CreateLogisticRouteDto {
    @IsDateString()
    fecha_rutero: string;

    @IsUUID()
    zona_id: string;

    @IsUUID()
    vehiculo_id: string;

    @IsUUID()
    transportista_id: string;

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => CreateLogisticStopDto)
    paradas: CreateLogisticStopDto[];
}

export class AddOrderDto {
    @IsUUID()
    pedido_id: string;

    @IsInt()
    @Min(1)
    orden_entrega: number;
}

export class CancelRuteroDto {
    @IsString()
    @IsOptional()
    motivo?: string;
}

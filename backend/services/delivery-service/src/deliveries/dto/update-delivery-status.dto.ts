import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { EstadoEntrega } from '../../common/constants/delivery-enums';

export class UpdateDeliveryStatusDto {
    @IsNotEmpty()
    @IsEnum(EstadoEntrega)
    estado: EstadoEntrega;

    @IsOptional()
    @IsString()
    receptorNombre?: string;

    @IsOptional()
    @IsString()
    observaciones?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    cantidadItemsEntregados?: number;

    @IsOptional()
    @IsNumber()
    @Min(-90)
    @Max(90)
    latitudEntrega?: number;

    @IsOptional()
    @IsNumber()
    @Min(-180)
    @Max(180)
    longitudEntrega?: number;
}

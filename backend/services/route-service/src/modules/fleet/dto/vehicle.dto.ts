import { IsString, IsInt, IsOptional, Min, IsEnum } from 'class-validator';
import { EstadoVehiculo } from '../../../common/constants/route-enums';

export class CreateVehicleDto {
    @IsString()
    placa: string;

    @IsString()
    @IsOptional()
    modelo?: string;

    @IsInt()
    @Min(1)
    @IsOptional()
    capacidad_kg?: number;
}

export class UpdateVehicleStatusDto {
    @IsEnum(EstadoVehiculo, {
        message: `estado must be one of: ${Object.values(EstadoVehiculo).join(', ')}`,
    })
    estado: EstadoVehiculo;
}

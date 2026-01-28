import { IsString, IsInt, IsOptional, Min, Max, IsEnum, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { EstadoVehiculo } from '../../../common/constants/route-enums';

export class CreateVehicleDto {
    @IsString({ message: 'placa debe ser texto' })
    @MaxLength(20, { message: 'placa no puede exceder 20 caracteres' })
    @Matches(/^[A-Z0-9-]+$/i, { message: 'placa solo puede contener letras, números y guiones' })
    @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase().trim() : value))
    placa: string;

    @IsString({ message: 'modelo debe ser texto' })
    @MaxLength(100, { message: 'modelo no puede exceder 100 caracteres' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @IsOptional()
    modelo?: string;

    @IsInt({ message: 'capacidad_kg debe ser un número entero' })
    @Min(1, { message: 'capacidad_kg debe ser al menos 1 kg' })
    @Max(100000, { message: 'capacidad_kg no puede exceder 100000 kg' })
    @IsOptional()
    capacidad_kg?: number;
}

export class UpdateVehicleStatusDto {
    @IsEnum(EstadoVehiculo, {
        message: `estado debe ser uno de: ${Object.values(EstadoVehiculo).join(', ')}`,
    })
    estado: EstadoVehiculo;
}

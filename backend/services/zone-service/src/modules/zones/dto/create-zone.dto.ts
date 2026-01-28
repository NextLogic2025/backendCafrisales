import { IsString, IsNotEmpty, IsOptional, IsObject, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO para crear una zona geográfica.
 * Límites según BD: codigo=20, nombre=100.
 */
export class CreateZoneDto {
    @IsString()
    @IsNotEmpty({ message: 'El código de zona es requerido' })
    @MaxLength(20, { message: 'El código no puede exceder 20 caracteres' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
    codigo: string;

    @IsString()
    @IsNotEmpty({ message: 'El nombre de zona es requerido' })
    @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    nombre: string;

    @IsString()
    @IsOptional()
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    descripcion?: string;

    @IsObject()
    @IsOptional()
    zonaGeom?: object;
}

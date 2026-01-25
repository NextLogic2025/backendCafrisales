import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsObject } from 'class-validator';

export class CreateZoneDto {
    @IsString()
    @IsNotEmpty()
    codigo: string;

    @IsString()
    @IsNotEmpty()
    nombre: string;

    @IsString()
    @IsOptional()
    descripcion?: string;

    @IsObject()
    @IsOptional()
    zonaGeom?: object; // GeoJSON
}

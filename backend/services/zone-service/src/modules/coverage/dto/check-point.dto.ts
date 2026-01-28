import { IsNumber, Min, Max } from 'class-validator';

/**
 * DTO para validar coordenadas geográficas (cobertura y resolución de zonas).
 */
export class CheckPointDto {
    @IsNumber()
    @Min(-90, { message: 'La latitud debe estar entre -90 y 90' })
    @Max(90, { message: 'La latitud debe estar entre -90 y 90' })
    lat: number;

    @IsNumber()
    @Min(-180, { message: 'La longitud debe estar entre -180 y 180' })
    @Max(180, { message: 'La longitud debe estar entre -180 y 180' })
    lon: number;
}

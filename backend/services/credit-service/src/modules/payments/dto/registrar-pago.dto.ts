import { IsNumber, IsDateString, IsString, IsOptional, Min } from 'class-validator';

export class RegistrarPagoDto {
    @IsNumber()
    @Min(0.01)
    monto_pago: number;

    @IsString()
    @IsOptional()
    moneda?: string = 'USD';

    @IsDateString()
    @IsOptional()
    fecha_pago?: string;

    @IsString()
    @IsOptional()
    metodo_registro?: string = 'manual';

    @IsString()
    @IsOptional()
    referencia?: string;

    @IsString()
    @IsOptional()
    notas?: string;
}

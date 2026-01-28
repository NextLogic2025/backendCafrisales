import {
    IsUUID,
    IsNumber,
    IsInt,
    IsString,
    IsOptional,
    IsDateString,
    Min,
    Max,
    MaxLength,
    Length,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class AprobarCreditoDto {
    @IsUUID('4', { message: 'pedido_id debe ser un UUID válido' })
    pedido_id: string;

    @IsUUID('4', { message: 'cliente_id debe ser un UUID válido' })
    cliente_id: string;

    @IsNumber({}, { message: 'monto_aprobado debe ser un número' })
    @Min(0.01, { message: 'monto_aprobado debe ser mayor a 0' })
    @Max(999999999999.99, { message: 'monto_aprobado excede el límite permitido' })
    monto_aprobado: number;

    @IsString({ message: 'moneda debe ser texto' })
    @Length(3, 3, { message: 'moneda debe tener exactamente 3 caracteres (ej: USD, PYG)' })
    @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase().trim() : value))
    @IsOptional()
    moneda?: string = 'USD';

    @IsInt({ message: 'plazo_dias debe ser un número entero' })
    @Min(1, { message: 'plazo_dias debe ser al menos 1 día' })
    @Max(365, { message: 'plazo_dias no puede exceder 365 días' })
    plazo_dias: number;

    @IsDateString({}, { message: 'fecha_aprobacion debe ser una fecha ISO válida' })
    @IsOptional()
    fecha_aprobacion?: string;

    @IsString({ message: 'notas debe ser texto' })
    @MaxLength(2000, { message: 'notas no puede exceder 2000 caracteres' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @IsOptional()
    notas?: string;
}

import {
    IsUUID,
    IsNumber,
    IsDateString,
    IsString,
    IsOptional,
    Min,
    Max,
    MaxLength,
    Length,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterPaymentDto {
    @IsUUID('4', { message: 'aprobacion_credito_id debe ser un UUID válido' })
    aprobacion_credito_id: string;

    @IsNumber({}, { message: 'monto_pago debe ser un número' })
    @Min(0.01, { message: 'monto_pago debe ser mayor a 0' })
    @Max(999999999999.99, { message: 'monto_pago excede el límite permitido' })
    monto_pago: number;

    @IsString({ message: 'moneda debe ser texto' })
    @Length(3, 3, { message: 'moneda debe tener exactamente 3 caracteres (ej: USD, PYG)' })
    @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase().trim() : value))
    @IsOptional()
    moneda?: string = 'USD';

    @IsDateString({}, { message: 'fecha_pago debe ser una fecha ISO válida' })
    @IsOptional()
    fecha_pago?: string;

    @IsUUID('4', { message: 'registrado_por_id debe ser un UUID válido' })
    registrado_por_id: string;

    @IsString({ message: 'metodo_registro debe ser texto' })
    @MaxLength(30, { message: 'metodo_registro no puede exceder 30 caracteres' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @IsOptional()
    metodo_registro?: string = 'manual';

    @IsString({ message: 'referencia debe ser texto' })
    @MaxLength(80, { message: 'referencia no puede exceder 80 caracteres' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @IsOptional()
    referencia?: string;

    @IsString({ message: 'notas debe ser texto' })
    @MaxLength(2000, { message: 'notas no puede exceder 2000 caracteres' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @IsOptional()
    notas?: string;
}

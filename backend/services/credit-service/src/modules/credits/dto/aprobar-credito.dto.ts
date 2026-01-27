import { IsUUID, IsNumber, IsInt, IsString, IsOptional, IsDateString, Min } from 'class-validator';

export class AprobarCreditoDto {
    @IsUUID()
    pedido_id: string;

    @IsUUID()
    cliente_id: string;

    @IsNumber()
    @Min(0.01)
    monto_aprobado: number;

    @IsString()
    @IsOptional()
    moneda?: string = 'USD';

    @IsInt()
    @Min(1)
    plazo_dias: number;

    @IsDateString()
    @IsOptional()
    fecha_aprobacion?: string;

    @IsString()
    @IsOptional()
    notas?: string;
}

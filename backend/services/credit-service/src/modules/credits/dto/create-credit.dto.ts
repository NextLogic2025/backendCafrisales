import { IsUUID, IsNumber, IsInt, IsString, IsOptional, IsEnum, IsDateString, Min } from 'class-validator';
import { OrigenCredito } from '../../../common/constants/credit-origin.enum';

export class CreateCreditDto {
    @IsUUID()
    pedido_id: string;

    @IsUUID()
    cliente_id: string;

    @IsUUID()
    aprobado_por_vendedor_id: string;

    @IsEnum(OrigenCredito)
    @IsOptional()
    origen?: OrigenCredito = OrigenCredito.VENDEDOR;

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

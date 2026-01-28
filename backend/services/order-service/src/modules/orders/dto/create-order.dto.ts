import {
    IsUUID,
    IsOptional,
    IsString,
    IsArray,
    ValidateNested,
    ArrayMinSize,
    IsEnum,
    IsDateString,
    IsNumber,
    Min,
    MaxLength,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { AddItemDto } from './add-item.dto';
import { MetodoPago } from '../../../common/constants/payment-method.enum';
import { TipoDescuento } from '../../../common/constants/discount-type.enum';

/**
 * DTO para crear un pedido.
 * Límites según BD: notas=text (sin límite duro, pero recomendado 2000).
 */
export class CreateOrderDto {
    @IsUUID()
    @IsOptional()
    cliente_id?: string;

    @IsUUID()
    @IsOptional()
    vendedor_id?: string;

    @IsUUID()
    @IsOptional()
    zona_id?: string;

    @IsEnum(MetodoPago, { message: 'Método de pago inválido (contado|credito)' })
    metodo_pago: MetodoPago;

    @IsEnum(TipoDescuento, { message: 'Tipo de descuento inválido (porcentaje|monto_fijo)' })
    @IsOptional()
    descuento_pedido_tipo?: TipoDescuento;

    @IsNumber()
    @Min(0, { message: 'El descuento no puede ser negativo' })
    @IsOptional()
    descuento_pedido_valor?: number;

    @IsDateString({}, { message: 'Fecha de entrega debe tener formato ISO (YYYY-MM-DD)' })
    @IsOptional()
    fecha_entrega_sugerida?: string;

    @IsString()
    @IsOptional()
    @MaxLength(2000, { message: 'Las notas no pueden exceder 2000 caracteres' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    notas?: string;

    @IsArray()
    @ArrayMinSize(1, { message: 'El pedido debe tener al menos un item' })
    @ValidateNested({ each: true })
    @Type(() => AddItemDto)
    items: AddItemDto[];
}

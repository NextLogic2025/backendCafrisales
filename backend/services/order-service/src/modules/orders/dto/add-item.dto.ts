import { IsUUID, IsInt, IsNumber, IsEnum, IsOptional, Min, Max, IsBoolean } from 'class-validator';
import { OrigenPrecio } from '../../../common/constants/price-origin.enum';
import { TipoDescuento } from '../../../common/constants/discount-type.enum';

/**
 * DTO para agregar un item al pedido.
 * Cantidad mínima 1. Porcentaje de descuento máximo 100%.
 */
export class AddItemDto {
    @IsUUID('4', { message: 'El SKU debe ser un UUID válido' })
    sku_id: string;

    @IsInt({ message: 'La cantidad debe ser un número entero' })
    @Min(1, { message: 'La cantidad mínima es 1' })
    cantidad: number;

    @IsNumber()
    @Min(0, { message: 'El precio final no puede ser negativo' })
    @IsOptional()
    precio_unitario_final?: number;

    @IsEnum(TipoDescuento, { message: 'Tipo de descuento inválido (porcentaje|monto_fijo)' })
    @IsOptional()
    descuento_item_tipo?: TipoDescuento;

    @IsNumber()
    @Min(0, { message: 'El valor de descuento no puede ser negativo' })
    @Max(100, { message: 'El porcentaje de descuento no puede superar 100%' })
    @IsOptional()
    descuento_item_valor?: number;

    @IsBoolean()
    @IsOptional()
    requiere_aprobacion?: boolean = false;

    @IsEnum(OrigenPrecio)
    @IsOptional()
    origen_precio?: OrigenPrecio = OrigenPrecio.CATALOGO;
}

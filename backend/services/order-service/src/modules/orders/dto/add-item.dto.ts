import { IsUUID, IsInt, IsNumber, IsEnum, IsOptional, Min, IsBoolean } from 'class-validator';
import { OrigenPrecio } from '../../../common/constants/price-origin.enum';
import { TipoDescuento } from '../../../common/constants/discount-type.enum';

export class AddItemDto {
    @IsUUID()
    sku_id: string;

    @IsInt()
    @Min(1)
    cantidad: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    precio_unitario_final?: number;

    @IsEnum(TipoDescuento)
    @IsOptional()
    descuento_item_tipo?: TipoDescuento;

    @IsNumber()
    @Min(0)
    @IsOptional()
    descuento_item_valor?: number;

    @IsBoolean()
    @IsOptional()
    requiere_aprobacion?: boolean = false;

    @IsEnum(OrigenPrecio)
    @IsOptional()
    origen_precio?: OrigenPrecio = OrigenPrecio.CATALOGO;
}

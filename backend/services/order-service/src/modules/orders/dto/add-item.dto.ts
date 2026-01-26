import { IsUUID, IsInt, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';
import { OrigenPrecio } from '../../../common/constants/price-origin.enum';

export class AddItemDto {
    @IsUUID()
    sku_id: string;

    @IsInt()
    @Min(1)
    cantidad: number;

    @IsNumber()
    @Min(0)
    precio_unitario: number;

    @IsEnum(OrigenPrecio)
    @IsOptional()
    origen_precio?: OrigenPrecio = OrigenPrecio.CATALOGO;
}

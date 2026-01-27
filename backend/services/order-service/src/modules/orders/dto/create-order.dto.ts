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
} from 'class-validator';
import { Type } from 'class-transformer';
import { AddItemDto } from './add-item.dto';
import { MetodoPago } from '../../../common/constants/payment-method.enum';
import { TipoDescuento } from '../../../common/constants/discount-type.enum';

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

    @IsEnum(MetodoPago)
    metodo_pago: MetodoPago;

    @IsEnum(TipoDescuento)
    @IsOptional()
    descuento_pedido_tipo?: TipoDescuento;

    @IsNumber()
    @Min(0)
    @IsOptional()
    descuento_pedido_valor?: number;

    @IsDateString()
    @IsOptional()
    fecha_entrega_sugerida?: string;

    @IsString()
    @IsOptional()
    notas?: string;

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => AddItemDto)
    items: AddItemDto[];
}

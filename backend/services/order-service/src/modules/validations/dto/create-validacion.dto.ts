import { IsUUID, IsString, IsEnum, IsOptional, IsArray, ValidateNested, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoItemResultado } from '../../../common/constants/item-validation.enum';

class ValidacionItemResultadoDto {
    @IsUUID()
    item_pedido_id: string;

    @IsEnum(EstadoItemResultado)
    estado_resultado: EstadoItemResultado;

    @IsUUID()
    @IsOptional()
    sku_aprobado_id?: string;

    @IsInt()
    @Min(0)
    @IsOptional()
    cantidad_aprobada?: number;

    @IsString()
    motivo: string;
}

export class CreateValidacionDto {
    @IsUUID()
    pedido_id: string;

    @IsUUID()
    bodeguero_id: string;

    @IsString()
    @IsOptional()
    observaciones?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ValidacionItemResultadoDto)
    items_resultados: ValidacionItemResultadoDto[];
}

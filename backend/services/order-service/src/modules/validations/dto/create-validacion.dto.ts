import { IsUUID, IsString, IsOptional, IsArray, ValidateNested, IsInt, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

class ItemValidacionDto {
    @IsUUID()
    item_pedido_id: string;

    @IsInt()
    @IsOptional()
    cantidad_disponible?: number;

    @IsInt()
    @IsOptional()
    cantidad_ajustada?: number;

    @IsString()
    @IsOptional()
    motivo_ajuste?: string;

    @IsBoolean()
    @IsOptional()
    aprobado?: boolean = true;
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
    @Type(() => ItemValidacionDto)
    items: ItemValidacionDto[];
}

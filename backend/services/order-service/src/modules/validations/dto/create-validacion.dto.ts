import { IsUUID, IsString, IsEnum, IsOptional, IsArray, ValidateNested, IsInt, Min, IsNotEmpty, MaxLength } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { EstadoItemResultado } from '../../../common/constants/item-validation.enum';

/**
 * DTO para el resultado de validación de un item individual.
 */
class ValidacionItemResultadoDto {
    @IsUUID('4', { message: 'item_pedido_id debe ser un UUID válido' })
    item_pedido_id: string;

    @IsEnum(EstadoItemResultado, { message: 'Estado de resultado inválido' })
    estado_resultado: EstadoItemResultado;

    @IsUUID('4', { message: 'sku_aprobado_id debe ser un UUID válido' })
    @IsOptional()
    sku_aprobado_id?: string;

    @IsInt({ message: 'cantidad_aprobada debe ser un entero' })
    @Min(0, { message: 'cantidad_aprobada no puede ser negativa' })
    @IsOptional()
    cantidad_aprobada?: number;

    @IsString()
    @IsNotEmpty({ message: 'El motivo es requerido para cada item' })
    @MaxLength(500, { message: 'El motivo no puede exceder 500 caracteres' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    motivo: string;
}

/**
 * DTO para crear una validación de bodega.
 * Debe incluir exactamente un resultado por cada item del pedido.
 */
export class CreateValidacionDto {
    @IsUUID('4', { message: 'pedido_id debe ser un UUID válido' })
    pedido_id: string;

    @IsUUID('4', { message: 'bodeguero_id debe ser un UUID válido' })
    bodeguero_id: string;

    @IsString()
    @IsOptional()
    @MaxLength(1000, { message: 'Las observaciones no pueden exceder 1000 caracteres' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    observaciones?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ValidacionItemResultadoDto)
    items_resultados: ValidacionItemResultadoDto[];
}

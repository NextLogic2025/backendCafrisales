import { IsUUID, IsString, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { AccionClienteAjuste } from '../../../common/constants/client-action.enum';

/**
 * DTO para registrar la acción del cliente ante un ajuste de bodega.
 */
export class CreateAccionDto {
    @IsUUID('4', { message: 'pedido_id debe ser un UUID válido' })
    pedido_id: string;

    @IsUUID('4', { message: 'validacion_id debe ser un UUID válido' })
    validacion_id: string;

    @IsUUID('4', { message: 'cliente_id debe ser un UUID válido' })
    cliente_id: string;

    @IsEnum(AccionClienteAjuste, { message: 'Acción inválida (acepta|rechaza)' })
    accion: AccionClienteAjuste;

    @IsString()
    @IsOptional()
    @MaxLength(500, { message: 'El comentario no puede exceder 500 caracteres' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    comentario?: string;
}

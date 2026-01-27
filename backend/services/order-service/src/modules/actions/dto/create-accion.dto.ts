import { IsUUID, IsString, IsEnum, IsOptional } from 'class-validator';
import { AccionClienteAjuste } from '../../../common/constants/client-action.enum';

export class CreateAccionDto {
    @IsUUID()
    pedido_id: string;

    @IsUUID()
    validacion_id: string;

    @IsUUID()
    cliente_id: string;

    @IsEnum(AccionClienteAjuste)
    accion: AccionClienteAjuste;

    @IsString()
    @IsOptional()
    comentario?: string;
}

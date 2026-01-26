import { IsUUID, IsString, IsEnum, IsOptional } from 'class-validator';

export enum AccionCliente {
    ACEPTAR = 'aceptar',
    RECHAZAR = 'rechazar',
}

export class CreateAccionDto {
    @IsUUID()
    validacion_id: string;

    @IsUUID()
    cliente_id: string;

    @IsEnum(AccionCliente)
    accion: AccionCliente;

    @IsString()
    @IsOptional()
    comentario?: string;
}

import { IsString, IsUUID, IsOptional, IsEnum, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum PrioridadNotificacion {
    BAJA = 'baja',
    NORMAL = 'normal',
    ALTA = 'alta',
    URGENTE = 'urgente',
}

export class CreateNotificationDto {
    @ApiProperty({ description: 'ID del usuario destinatario' })
    @IsUUID()
    usuarioId: string;

    @ApiProperty({ description: 'Tipo de notificación' })
    @IsString()
    tipo: string;

    @ApiProperty({ description: 'Título de la notificación' })
    @IsString()
    titulo: string;

    @ApiProperty({ description: 'Mensaje de la notificación' })
    @IsString()
    mensaje: string;

    @ApiProperty({ description: 'Payload adicional', required: false })
    @IsOptional()
    @IsObject()
    payload?: Record<string, any>;

    @ApiProperty({ description: 'Servicio origen', example: 'order' })
    @IsString()
    origenServicio: string;

    @ApiProperty({ description: 'ID del evento origen', required: false })
    @IsOptional()
    @IsUUID()
    origenEventoId?: string;

    @ApiProperty({ enum: PrioridadNotificacion, default: PrioridadNotificacion.NORMAL })
    @IsOptional()
    @IsEnum(PrioridadNotificacion)
    prioridad?: PrioridadNotificacion;

    @ApiProperty({ description: 'Requiere acción del usuario', default: false })
    @IsOptional()
    @IsBoolean()
    requiereAccion?: boolean;

    @ApiProperty({ description: 'URL para la acción', required: false })
    @IsOptional()
    @IsString()
    urlAccion?: string;
}

export class QueryNotificationsDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsUUID()
    usuarioId?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    tipo?: string;

    @ApiProperty({ required: false, default: false })
    @IsOptional()
    @IsBoolean()
    soloNoLeidas?: boolean;

    @ApiProperty({ required: false, default: 50 })
    @IsOptional()
    limit?: number;
}

export class MarkAsReadDto {
    @ApiProperty({ description: 'ID de la notificación' })
    @IsUUID()
    id: string;
}

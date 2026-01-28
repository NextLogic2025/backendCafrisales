import { Transform } from 'class-transformer';
import {
    IsString,
    IsUUID,
    IsOptional,
    IsEnum,
    IsBoolean,
    IsObject,
    IsInt,
    Min,
    Max,
    MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PrioridadNotificacion } from '../entities/notification.entity';

export { PrioridadNotificacion };

export class CreateNotificationDto {
    @ApiProperty({ description: 'ID del usuario destinatario' })
    @IsUUID('4', { message: 'usuarioId debe ser un UUID v4 válido' })
    usuarioId: string;

    @ApiProperty({ description: 'ID del tipo de notificación (FK a tipos_notificacion)' })
    @IsUUID('4', { message: 'tipoId debe ser un UUID v4 válido' })
    tipoId: string;

    @ApiProperty({ description: 'Título de la notificación' })
    @IsString({ message: 'titulo debe ser un string' })
    @MaxLength(255, { message: 'titulo no debe exceder 255 caracteres' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    titulo: string;

    @ApiProperty({ description: 'Mensaje de la notificación' })
    @IsString({ message: 'mensaje debe ser un string' })
    @MaxLength(5000, { message: 'mensaje no debe exceder 5000 caracteres' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    mensaje: string;

    @ApiProperty({ description: 'Payload adicional', required: false })
    @IsOptional()
    @IsObject({ message: 'payload debe ser un objeto' })
    payload?: Record<string, unknown>;

    @ApiProperty({ description: 'Servicio origen', example: 'order' })
    @IsString({ message: 'origenServicio debe ser un string' })
    @MaxLength(50, { message: 'origenServicio no debe exceder 50 caracteres' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    origenServicio: string;

    @ApiProperty({ description: 'ID del evento origen (para idempotencia)', required: false })
    @IsOptional()
    @IsUUID('4', { message: 'origenEventoId debe ser un UUID v4 válido' })
    origenEventoId?: string;

    @ApiProperty({ enum: PrioridadNotificacion, default: PrioridadNotificacion.NORMAL })
    @IsOptional()
    @IsEnum(PrioridadNotificacion, { message: 'prioridad debe ser: baja, normal, alta, urgente' })
    prioridad?: PrioridadNotificacion;

    @ApiProperty({ description: 'Requiere acción del usuario', default: false })
    @IsOptional()
    @IsBoolean({ message: 'requiereAccion debe ser booleano' })
    requiereAccion?: boolean;

    @ApiProperty({ description: 'URL para la acción (requerida si requiereAccion=true)', required: false })
    @IsOptional()
    @IsString({ message: 'urlAccion debe ser un string' })
    @MaxLength(2000, { message: 'urlAccion no debe exceder 2000 caracteres' })
    urlAccion?: string;
}

export class QueryNotificationsDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsUUID('4', { message: 'usuarioId debe ser un UUID v4 válido' })
    usuarioId?: string;

    @ApiProperty({ description: 'Filtrar por tipo de notificación', required: false })
    @IsOptional()
    @IsUUID('4', { message: 'tipoId debe ser un UUID v4 válido' })
    tipoId?: string;

    @ApiProperty({ required: false, default: false })
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean({ message: 'soloNoLeidas debe ser booleano' })
    soloNoLeidas?: boolean;

    @ApiProperty({ required: false, default: 50 })
    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    @IsInt({ message: 'limit debe ser un entero' })
    @Min(1, { message: 'limit mínimo es 1' })
    @Max(100, { message: 'limit máximo es 100' })
    limit?: number;
}

export class MarkAsReadDto {
    @ApiProperty({ description: 'ID de la notificación' })
    @IsUUID('4', { message: 'id debe ser un UUID v4 válido' })
    id: string;
}

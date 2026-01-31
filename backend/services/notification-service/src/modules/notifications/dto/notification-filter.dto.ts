import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsBoolean, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';
import { PrioridadNotificacion } from '../entities/notification.entity';

export class NotificationFilterDto {
    @ApiPropertyOptional({ description: 'Filtrar por estado de lectura' })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    isRead?: boolean;

    @ApiPropertyOptional({ description: 'Tipo de notificación (ID del tipo)' })
    @IsOptional()
    typeId?: string;

    @ApiPropertyOptional({ enum: PrioridadNotificacion, description: 'Prioridad' })
    @IsOptional()
    @IsEnum(PrioridadNotificacion)
    priority?: PrioridadNotificacion;

    @ApiPropertyOptional({ description: 'Fecha desde' })
    @IsOptional()
    @IsDateString()
    fromDate?: string;

    @ApiPropertyOptional({ description: 'Fecha hasta' })
    @IsOptional()
    @IsDateString()
    toDate?: string;
}

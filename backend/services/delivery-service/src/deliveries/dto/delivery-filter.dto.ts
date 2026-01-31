import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsEnum, IsDateString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { EstadoEntrega as DeliveryStatus } from '../../common/constants/delivery-enums';

export class DeliveryFilterDto {
    @ApiPropertyOptional({ enum: DeliveryStatus, description: 'Estado del envío' })
    @IsOptional()
    @IsEnum(DeliveryStatus)
    status?: DeliveryStatus;

    @ApiPropertyOptional({ description: 'ID del conductor' })
    @IsOptional()
    @IsUUID()
    driverId?: string;

    @ApiPropertyOptional({ description: 'ID de la ruta' })
    @IsOptional()
    @IsUUID()
    routeId?: string;

    @ApiPropertyOptional({ description: 'ID de la zona' })
    @IsOptional()
    @IsUUID()
    zoneId?: string;

    @ApiPropertyOptional({ description: 'Fecha desde (ISO 8601)' })
    @IsOptional()
    @IsDateString()
    fromDate?: string;

    @ApiPropertyOptional({ description: 'Fecha hasta (ISO 8601)' })
    @IsOptional()
    @IsDateString()
    toDate?: string;

    @ApiPropertyOptional({ description: 'Filtrar si tiene incidentes' })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    hasIncidents?: boolean;
}

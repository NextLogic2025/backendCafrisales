import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsNumber, IsString, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoCredito } from '../../../common/constants/credit-status.enum';

export class CreditFilterDto {
    @ApiPropertyOptional({ description: 'ID del cliente' })
    @IsOptional()
    @IsUUID()
    customerId?: string;

    @ApiPropertyOptional({ description: 'ID del vendedor' })
    @IsOptional()
    @IsUUID()
    sellerId?: string;

    @ApiPropertyOptional({ description: 'Estado del crédito', enum: EstadoCredito })
    @IsOptional()
    @IsEnum(EstadoCredito)
    status?: EstadoCredito;

    @ApiPropertyOptional({ description: 'Monto mínimo' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    minAmount?: number;

    @ApiPropertyOptional({ description: 'Monto máximo' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    maxAmount?: number;

    @ApiPropertyOptional({ description: 'ID del pedido' })
    @IsOptional()
    @IsUUID()
    orderId?: string;
}

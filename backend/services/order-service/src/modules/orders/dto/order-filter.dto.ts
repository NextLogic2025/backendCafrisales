import { IsEnum, IsOptional, IsString, IsUUID, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoPedido } from '../../../common/constants/order-status.enum';

export class OrderFilterDto {
    @IsOptional()
    @IsEnum(EstadoPedido)
    status?: EstadoPedido;

    @IsOptional()
    @IsUUID('4')
    customerId?: string;

    @IsOptional()
    @IsUUID('4')
    sellerId?: string;

    @IsOptional()
    @IsString()
    fromDate?: string;

    @IsOptional()
    @IsString()
    toDate?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    minTotal?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    maxTotal?: number;
}

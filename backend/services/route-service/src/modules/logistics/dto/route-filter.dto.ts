import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { EstadoRutero } from '../../../common/constants/route-enums';

export class RouteFilterDto {
    @IsOptional()
    @IsEnum(EstadoRutero)
    status?: EstadoRutero;

    @IsOptional()
    @IsUUID('4')
    driverId?: string;

    @IsOptional()
    @IsUUID('4')
    zoneId?: string;

    @IsOptional()
    @IsString()
    date?: string;

    @IsOptional()
    @IsString()
    fromDate?: string;

    @IsOptional()
    @IsString()
    toDate?: string;
}

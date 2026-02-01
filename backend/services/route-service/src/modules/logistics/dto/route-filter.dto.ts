import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { EstadoRutero } from '../../../common/constants/route-enums';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class RouteFilterDto extends PaginationQueryDto {
    @IsOptional()
    @Transform(({ value }) => {
        if (Array.isArray(value)) {
            return value.map((item) => String(item).toLowerCase().trim()).filter(Boolean);
        }
        if (typeof value === 'string') {
            return value
                .split(',')
                .map((item) => item.toLowerCase().trim())
                .filter(Boolean);
        }
        return value;
    })
    @IsEnum(EstadoRutero, { each: true })
    status?: EstadoRutero[];

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

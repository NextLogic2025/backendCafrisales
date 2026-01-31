import { IsOptional, IsString, IsBoolean, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class ZoneFilterDto {
    @IsOptional()
    @IsString()
    @IsIn(['activo', 'inactivo'])
    status?: string;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    hasAssignedUsers?: boolean;
}

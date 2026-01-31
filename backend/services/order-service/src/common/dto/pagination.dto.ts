import { IsNumber, IsOptional, IsPositive, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationQueryDto {
    @IsOptional()
    @IsNumber()
    @IsPositive()
    @Type(() => Number)
    page: number = 1;

    @IsOptional()
    @IsNumber()
    @IsPositive()
    @Type(() => Number)
    limit: number = 10;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    skip?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    take?: number;

    @IsOptional()
    @IsString()
    sortBy: string = 'createdAt';

    @IsOptional()
    @IsString()
    @IsIn(['ASC', 'DESC'])
    sortOrder: 'ASC' | 'DESC' = 'DESC';
}

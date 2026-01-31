import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsNumber, IsString, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ProductFilterDto {
    @ApiPropertyOptional({ description: 'Buscar por nombre' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ description: 'Filtrar por categoría' })
    @IsOptional()
    @IsUUID()
    categoryId?: string;

    @ApiPropertyOptional({ description: 'Precio mínimo' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    minPrice?: number;

    @ApiPropertyOptional({ description: 'Precio máximo' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    maxPrice?: number;

    @ApiPropertyOptional({ description: 'Solo productos activos' })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isActive?: boolean = true;

    @ApiPropertyOptional({ description: 'Solo con stock disponible' })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    inStock?: boolean;
}

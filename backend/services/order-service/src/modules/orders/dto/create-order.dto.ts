import { IsUUID, IsOptional, IsString, IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { AddItemDto } from './add-item.dto';

export class CreateOrderDto {
    @IsUUID()
    cliente_id: string;

    @IsUUID()
    @IsOptional()
    vendedor_id?: string;

    @IsUUID()
    @IsOptional()
    zona_id?: string;

    @IsString()
    @IsOptional()
    notas?: string;

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => AddItemDto)
    items: AddItemDto[];
}

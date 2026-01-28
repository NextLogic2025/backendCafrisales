import { IsArray, IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class RejectPromosDto {
    @IsBoolean()
    @IsOptional()
    reject_all?: boolean;

    @IsArray()
    @IsUUID('4', { each: true })
    @IsOptional()
    item_ids?: string[];
}

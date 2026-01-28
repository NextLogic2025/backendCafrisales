import { IsArray, IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class ApprovePromosDto {
    @IsBoolean()
    @IsOptional()
    approve_all?: boolean;

    @IsArray()
    @IsUUID('4', { each: true })
    @IsOptional()
    item_ids?: string[];
}

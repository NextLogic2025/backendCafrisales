import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdatePasswordDto {
    @IsOptional()
    @IsString()
    currentPassword?: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    newPassword: string;
}

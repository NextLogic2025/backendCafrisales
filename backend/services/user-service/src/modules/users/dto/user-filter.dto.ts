import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { RolUsuario } from '../../../common/enums/rol-usuario.enum';
import { Usuario } from '../entities/usuario.entity'; // Corrected import

export class UserFilterDto {
    @IsOptional()
    @IsEnum(RolUsuario)
    role?: RolUsuario;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsUUID('4')
    zoneId?: string;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    createdFrom?: string;

    @IsOptional()
    @IsString()
    createdTo?: string;
}

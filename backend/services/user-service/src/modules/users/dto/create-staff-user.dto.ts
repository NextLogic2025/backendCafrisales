import { IsEmail, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateStaffUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  password: string;

  @IsNotEmpty()
  nombres: string;

  @IsNotEmpty()
  apellidos: string;

  @IsOptional()
  telefono?: string;

  @IsOptional()
  codigo_empleado?: string;

  @IsOptional()
  @IsUUID()
  supervisor_id?: string;

  @IsOptional()
  numero_licencia?: string;

  @IsOptional()
  licencia_vence_en?: string;
}

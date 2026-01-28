import { IsEmail, IsNotEmpty, IsOptional, IsUUID, MaxLength, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateStaffUserDto {
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim().toLowerCase())
  email: string;

  @IsNotEmpty()
  password: string;

  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  nombres: string;

  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  apellidos: string;

  @IsOptional()
  @MaxLength(30)
  @Transform(({ value }) => value?.trim())
  telefono?: string;

  @IsOptional()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  codigo_empleado?: string;

  @IsOptional()
  @IsUUID()
  supervisor_id?: string;

  @IsOptional()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  numero_licencia?: string;

  @IsOptional()
  @IsDateString()
  licencia_vence_en?: string;
}

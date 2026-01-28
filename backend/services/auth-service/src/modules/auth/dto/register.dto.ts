import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  @MaxLength(255, { message: 'El email no debe exceder 255 caracteres' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  readonly email: string;

  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @IsString({ message: 'La contraseña debe ser un string' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(128, { message: 'La contraseña no debe exceder 128 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'La contraseña debe contener mayúscula, minúscula, número y carácter especial',
  })
  readonly password: string;

  @IsOptional()
  @IsString({ message: 'El nombre debe ser un string' })
  @MaxLength(200, { message: 'El nombre no debe exceder 200 caracteres' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  readonly name?: string;

  @IsOptional()
  @IsUUID('4', { message: 'creado_por debe ser un UUID v4 válido' })
  readonly creado_por?: string;

  @IsOptional()
  @IsUUID('4', { message: 'usuario_id debe ser un UUID v4 válido' })
  readonly usuario_id?: string;

  @IsOptional()
  @IsString({ message: 'rol debe ser un string' })
  @MaxLength(50, { message: 'rol no debe exceder 50 caracteres' })
  readonly rol?: string;

  @IsOptional()
  readonly perfil?: Record<string, unknown>;

  @IsOptional()
  readonly cliente?: Record<string, unknown>;

  @IsOptional()
  readonly vendedor?: Record<string, unknown>;

  @IsOptional()
  readonly supervisor?: Record<string, unknown>;

  @IsOptional()
  readonly bodeguero?: Record<string, unknown>;

  @IsOptional()
  readonly transportista?: Record<string, unknown>;
}

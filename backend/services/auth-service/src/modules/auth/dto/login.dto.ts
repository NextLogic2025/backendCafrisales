import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  @MaxLength(255, { message: 'El email no debe exceder 255 caracteres' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  readonly email: string;

  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @IsString({ message: 'La contraseña debe ser un string' })
  @MaxLength(128, { message: 'La contraseña no debe exceder 128 caracteres' })
  readonly password: string;
}

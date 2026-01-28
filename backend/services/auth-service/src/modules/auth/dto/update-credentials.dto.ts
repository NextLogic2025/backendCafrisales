import { IsEmail, IsString, MinLength } from 'class-validator';

export class UpdateEmailDto {
  @IsEmail({}, { message: 'email debe ser un correo valido' })
  email: string;
}

export class UpdatePasswordDto {
  @IsString({ message: 'password requerido' })
  @MinLength(6, { message: 'password debe tener al menos 6 caracteres' })
  password: string;
}

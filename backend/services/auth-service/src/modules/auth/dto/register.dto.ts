import { IsEmail, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  readonly email: string;

  @IsNotEmpty()
  readonly password: string;

  @IsOptional()
  readonly name?: string;

  @IsOptional()
  @IsUUID()
  readonly creado_por?: string;
}

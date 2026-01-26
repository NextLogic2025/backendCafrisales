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

  @IsOptional()
  @IsUUID()
  readonly usuario_id?: string;

  // Optional user fields to pass to user-service via outbox
  @IsOptional()
  readonly rol?: string;

  @IsOptional()
  readonly perfil?: any;

  @IsOptional()
  readonly cliente?: any;

  @IsOptional()
  readonly vendedor?: any;

  @IsOptional()
  readonly supervisor?: any;

  @IsOptional()
  readonly bodeguero?: any;
}

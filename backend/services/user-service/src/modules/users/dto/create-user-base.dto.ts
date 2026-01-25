import { IsEmail, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateUserBaseDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  password: string;

  @IsOptional()
  name?: string;

  @IsOptional()
  @IsUUID()
  creado_por?: string;
}

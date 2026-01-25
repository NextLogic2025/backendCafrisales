import { IsEmail, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateUserBaseDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  password?: string;

  @IsOptional()
  name?: string;

  @IsOptional()
  @IsUUID()
  creado_por?: string;

  @IsOptional()
  @IsUUID()
  id?: string;
}

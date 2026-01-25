import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateUserBaseDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  password: string;

  @IsOptional()
  name?: string;
}

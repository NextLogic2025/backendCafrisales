import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LogoutDto {
  @IsNotEmpty({ message: 'refresh_token es requerido' })
  @IsString({ message: 'refresh_token debe ser un string' })
  @MaxLength(256, { message: 'refresh_token no debe exceder 256 caracteres' })
  readonly refresh_token: string;
}

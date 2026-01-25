import { IsNotEmpty } from 'class-validator';

export class LogoutDto {
  @IsNotEmpty()
  readonly refresh_token: string;
}

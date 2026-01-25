import { IsNotEmpty } from 'class-validator';

export class RefreshDto {
  @IsNotEmpty()
  readonly refresh_token: string;
}

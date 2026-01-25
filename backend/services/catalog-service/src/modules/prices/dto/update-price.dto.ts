import { IsUUID, IsNumber, Min } from 'class-validator';

export class UpdatePriceDto {
  @IsUUID()
  sku_id: string;

  @IsNumber()
  @Min(0)
  precio: number;
}

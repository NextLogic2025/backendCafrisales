import { IsNumber, Min, IsOptional, IsString } from 'class-validator';

export class UpdateSkuPriceDto {
  @IsNumber()
  @Min(0)
  nuevo_precio: number;

  @IsOptional()
  @IsString()
  motivo?: string;
}

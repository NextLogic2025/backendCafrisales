import { IsNumber, Min, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSkuPriceDto {
  @IsNumber()
  @Min(0)
  precio: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  moneda?: string;
}

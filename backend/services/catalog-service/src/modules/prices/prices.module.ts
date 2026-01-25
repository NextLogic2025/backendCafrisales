import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PricesService } from './prices.service';
import { PricesController } from './prices.controller';
import { PrecioSku } from './entities/precio-sku.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PrecioSku])],
  providers: [PricesService],
  controllers: [PricesController],
  exports: [PricesService],
})
export class PricesModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SkusService } from './skus.service';
import { SkusController } from './skus.controller';
import { Sku } from './entities/sku.entity';
import { Product } from '../products/entities/product.entity';
import { OutboxModule } from '../outbox/outbox.module';

@Module({
  imports: [TypeOrmModule.forFeature([Sku, Product]), OutboxModule],
  providers: [SkusService],
  controllers: [SkusController],
  exports: [SkusService],
})
export class SkusModule {}

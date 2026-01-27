import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SkusService } from './skus.service';
import { SkusController } from './skus.controller';
import { SkusInternalController } from './skus.internal.controller';
import { Sku } from './entities/sku.entity';
import { Product } from '../products/entities/product.entity';
import { OutboxModule } from '../outbox/outbox.module';

@Module({
  imports: [TypeOrmModule.forFeature([Sku, Product]), OutboxModule],
  providers: [SkusService],
  controllers: [SkusController, SkusInternalController],
  exports: [SkusService],
})
export class SkusModule {}

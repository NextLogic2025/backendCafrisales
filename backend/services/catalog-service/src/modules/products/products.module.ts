import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { OutboxModule } from '../outbox/outbox.module';
import { SkusModule } from '../skus/skus.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Category]), OutboxModule, SkusModule],
  providers: [ProductsService],
  controllers: [ProductsController],
  exports: [ProductsService],
})
export class ProductsModule {}

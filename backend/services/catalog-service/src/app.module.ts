import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typeorm.config';
import { JwtModule } from '@nestjs/jwt';

import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { SkusModule } from './modules/skus/skus.module';
import { PricesModule } from './modules/prices/prices.module';
import { OutboxModule } from './modules/outbox/outbox.module';
import { HealthModule } from './modules/health/health.module';

import { JwtStrategy } from './common/strategies/jwt.strategy';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { S2S_CLIENT } from './common/interfaces/s2s-client.interface';
import { HttpS2SAdapter } from './common/adapters/http-s2s.adapter';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(typeOrmConfig()),
    CategoriesModule,
    ProductsModule,
    SkusModule,
    PricesModule,
    OutboxModule,
    HealthModule, 
  ],
  providers: [
    JwtStrategy,
    JwtAuthGuard,
    {
      provide: S2S_CLIENT,
      useClass: HttpS2SAdapter,
    },
  ],
})
export class AppModule {}

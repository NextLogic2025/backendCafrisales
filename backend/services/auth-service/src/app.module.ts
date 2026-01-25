import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { OutboxModule } from './modules/outbox/outbox.module';
import { typeOrmConfig } from './config/typeorm.config';
import { envValidationSchema } from './config/env.validation';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, validationSchema: envValidationSchema }), TypeOrmModule.forRoot(typeOrmConfig()), AuthModule, HealthModule, OutboxModule],
})
export class AppModule {}

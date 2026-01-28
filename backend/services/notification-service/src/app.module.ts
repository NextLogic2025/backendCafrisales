import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { typeormConfig, orderDbConfig } from './config/typeorm.config';
import { envValidationSchema } from './config/env.validation';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ConsumersModule } from './modules/consumers/consumers.module';
import { HealthModule } from './modules/health/health.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [typeormConfig, orderDbConfig],
            validationSchema: envValidationSchema,
        }),
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => configService.get('typeorm'),
        }),
        TypeOrmModule.forRootAsync({
            name: 'orderConnection',
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => configService.get('orderDb'),
        }),
        ScheduleModule.forRoot(),
        NotificationsModule,
        ConsumersModule,
        HealthModule,
    ],
})
export class AppModule { }

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeormConfig } from './config/typeorm.config';
import { ZonesModule } from './modules/zones/zones.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { CoverageModule } from './modules/coverage/coverage.module';
import { HealthModule } from './modules/health/health.module';
import { OutboxModule } from './modules/outbox/outbox.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [typeormConfig],
        }),
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) =>
                configService.get('typeorm'),
        }),
        HealthModule,
        ZonesModule,
        SchedulesModule,
        CoverageModule,
        OutboxModule,
    ],
})
export class AppModule { }

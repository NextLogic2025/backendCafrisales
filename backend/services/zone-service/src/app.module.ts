import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { typeormConfig } from './config/typeorm.config';
import { ZonesModule } from './modules/zones/zones.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { CoverageModule } from './modules/coverage/coverage.module';
import { HealthModule } from './modules/health/health.module';
import { OutboxModule } from './modules/outbox/outbox.module';
import { InternalModule } from './modules/internal/internal.module';
import { JwtStrategy } from './common/strategies/jwt.strategy';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [typeormConfig],
        }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: '15m' },
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
        InternalModule,
    ],
    providers: [JwtStrategy, JwtAuthGuard],
})
export class AppModule { }

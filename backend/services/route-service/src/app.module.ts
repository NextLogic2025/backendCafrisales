import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { typeormConfig } from './config/typeorm.config';
import { envValidationSchema } from './config/env.validation';
import { JwtStrategy } from './common/strategies/jwt.strategy';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { S2S_CLIENT } from './common/interfaces/s2s-client.interface';
import { HttpS2SAdapter } from './common/adapters/http-s2s.adapter';
import { FleetModule } from './modules/fleet/fleet.module';
import { CommercialModule } from './modules/commercial/commercial.module';
import { LogisticsModule } from './modules/logistics/logistics.module';
import { HistoryModule } from './modules/history/history.module';
import { HealthModule } from './modules/health/health.module';
import { OutboxModule } from './modules/outbox/outbox.module';
import { UserExternalService } from './services/user-external.service';
import { OrderExternalService } from './services/order-external.service';
import { ZoneExternalService } from './services/zone-external.service';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [typeormConfig],
            validationSchema: envValidationSchema,
        }),
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => configService.get('typeorm'),
        }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: '60m' },
        }),
        FleetModule,
        CommercialModule,
        LogisticsModule,
        HistoryModule,
        HealthModule,
        OutboxModule,
    ],
    providers: [
        JwtStrategy,
        JwtAuthGuard,
        RolesGuard,
        UserExternalService,
        OrderExternalService,
        ZoneExternalService,
        {
            provide: S2S_CLIENT,
            useClass: HttpS2SAdapter,
        },
    ],
})
export class AppModule { }

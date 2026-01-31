import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { envValidationSchema } from './config/env.validation';
import { typeormConfig } from './config/typeorm.config';
import { JwtStrategy } from './common/strategies/jwt.strategy';
import { S2S_CLIENT } from './common/interfaces/s2s-client.interface';
import { HttpS2SAdapter } from './common/adapters/http-s2s.adapter';
import { DeliveriesModule } from './deliveries/deliveries.module';
import { EvidenceModule } from './evidence/evidence.module';
import { IncidentsModule } from './incidents/incidents.module';
import { HistoryModule } from './history/history.module';
import { HealthModule } from './health/health.module';
import { OrderExternalService } from './services/order-external.service';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validationSchema: envValidationSchema,
        }),
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => typeormConfig(),
        }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: '1d' },
            }),
        }),
        DeliveriesModule,
        EvidenceModule,
        IncidentsModule,
        HistoryModule,
        HealthModule,
    ],
    providers: [
        JwtStrategy,
        OrderExternalService,
        {
            provide: S2S_CLIENT,
            useClass: HttpS2SAdapter,
        },
    ],
})
export class AppModule { }

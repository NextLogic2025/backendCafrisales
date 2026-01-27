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
import { ServiceTokenGuard } from './common/guards/service-token.guard';
import { HealthModule } from './modules/health/health.module';
import { OrdersModule } from './modules/orders/orders.module';
import { OutboxModule } from './modules/outbox/outbox.module';
import { ValidationsModule } from './modules/validations/validations.module';
import { ActionsModule } from './modules/actions/actions.module';
import { HistoryModule } from './modules/history/history.module';
import { ExternalServicesModule } from './modules/external-services/external-services.module';

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
            secret: process.env.JWT_SECRET || 'changeme',
            signOptions: { expiresIn: '60m' },
        }),
        HealthModule,
        ExternalServicesModule,
        OrdersModule,
        OutboxModule,
        ValidationsModule,
        ActionsModule,
        HistoryModule,
    ],
    providers: [
        JwtStrategy,
        JwtAuthGuard,
        RolesGuard,
        ServiceTokenGuard,
    ],
})
export class AppModule { }

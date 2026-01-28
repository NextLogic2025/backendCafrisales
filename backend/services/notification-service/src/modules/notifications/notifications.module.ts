import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { TiposNotificacionService } from './tipos-notificacion.service';
import { NotificationsGateway } from './notifications.gateway';
import { Notification } from './entities/notification.entity';
import { TipoNotificacion } from './entities/tipo-notificacion.entity';
import { PreferenciaNotificacion } from './entities/preferencia-notificacion.entity';
import { SuscripcionNotificacion } from './entities/suscripcion-notificacion.entity';
import { HistorialEnvio } from './entities/historial-envio.entity';
import { Outbox } from './entities/outbox.entity';
import { JwtStrategy } from '../../common/strategies/jwt.strategy';

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: '24h' },
            }),
        }),
        TypeOrmModule.forFeature([
            Notification,
            TipoNotificacion,
            PreferenciaNotificacion,
            SuscripcionNotificacion,
            HistorialEnvio,
            Outbox,
        ]),
    ],
    controllers: [NotificationsController],
    providers: [
        NotificationsService,
        TiposNotificacionService,
        NotificationsGateway,
        JwtStrategy,
    ],
    exports: [NotificationsService, TiposNotificacionService, NotificationsGateway],
})
export class NotificationsModule { }


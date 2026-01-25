import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Credential } from './entities/credential.entity';
import { Session } from './entities/session.entity';
import { LoginAttempt } from './entities/login-attempt.entity';
import { JwtModule } from '@nestjs/jwt';
import { S2S_CLIENT } from '../../common/interfaces/s2s-client.interface';
import { HttpS2SAdapter } from '../../common/adapters/http-s2s.adapter';
import { OutboxModule } from '../outbox/outbox.module';
import { SessionService } from './services/session.service';
import { UserExternalService } from '../../services/user-external.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Credential, Session, LoginAttempt]),
    OutboxModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'changeme',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    SessionService,
    UserExternalService,
    JwtStrategy,
    LocalStrategy,
    { provide: S2S_CLIENT, useClass: HttpS2SAdapter },
  ],
  exports: [AuthService],
})
export class AuthModule { }

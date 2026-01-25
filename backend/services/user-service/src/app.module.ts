import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { typeOrmConfig } from './config/typeorm.config';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './common/strategies/jwt.strategy';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { UsersService } from './modules/users/users.service';
import { Usuario } from './modules/users/entities/usuario.entity';
import { HealthModule } from './modules/health/health.module';
import { UsersController } from './modules/users/users.controller';
import { ProfilesController } from './modules/profiles/profiles.controller';
import { Cliente } from './modules/clients/entities/cliente.entity';
import { ClientsController } from './modules/clients/clients.controller';
import { CondicionesComercialesCliente } from './modules/clients/entities/condiciones.entity';
import { Perfil } from './modules/profiles/entities/perfil.entity';
import { Outbox } from './modules/outbox/entities/outbox.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(typeOrmConfig()),
    TypeOrmModule.forFeature([Usuario, Perfil, Cliente, CondicionesComercialesCliente, Outbox]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'changeme',
      signOptions: { expiresIn: '15m' },
    }),
    HealthModule,
  ],
  controllers: [UsersController, ProfilesController, ClientsController],
  providers: [
    UsersService,
    JwtStrategy,
    JwtAuthGuard,
    {
      provide: 'AUTH_CLIENT',
      useFactory: () =>
        ClientProxyFactory.create({
          transport: Transport.TCP,
          options: {
            host: process.env.AUTH_SERVICE_HOST || 'auth-service',
            port: Number(process.env.AUTH_SERVICE_PORT) || 3001,
          },
        }),
    },
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { typeOrmConfig } from './config/typeorm.config';
import { envValidationSchema } from './config/env.validation';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './common/strategies/jwt.strategy';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { UsersService } from './modules/users/users.service';
import { RoleProvisionService } from './modules/users/services/role-provision.service';
import { ProfilesService } from './modules/users/services/profiles.service';
import { S2S_CLIENT } from './common/interfaces/s2s-client.interface';
import { HttpS2SAdapter } from './common/adapters/http-s2s.adapter';
import { Usuario } from './modules/users/entities/usuario.entity';
import { HealthModule } from './modules/health/health.module';
import { UsersController } from './modules/users/users.controller';
import { UsersInternalController } from './modules/users/users.internal.controller';
import { ProfilesController } from './modules/profiles/profiles.controller';
import { Cliente } from './modules/clients/entities/cliente.entity';
import { ClientsController } from './modules/clients/clients.controller';
import { ClientsQueryController } from './modules/clients/clients-query.controller';
import { CondicionesComercialesCliente } from './modules/clients/entities/condiciones.entity';
import { Perfil } from './modules/profiles/entities/perfil.entity';
import { Outbox } from './modules/outbox/entities/outbox.entity';
import { CanalComercial } from './modules/channels/entities/canal-comercial.entity';
import { ChannelsController } from './modules/channels/channels.controller';
import { ChannelsService } from './modules/channels/channels.service';
import { ClientsService } from './modules/clients/clients.service';
import { OutboxService } from './modules/outbox/outbox.service';
import { StaffController } from './modules/staff/staff.controller';
import { StaffService } from './modules/staff/staff.service';
import { Supervisor } from './modules/staff/entities/supervisor.entity';
import { Vendedor } from './modules/staff/entities/vendedor.entity';
import { Bodeguero } from './modules/staff/entities/bodeguero.entity';
import { Transportista } from './modules/staff/entities/transportista.entity';
import { ZoneExternalService } from './services/zone-external.service';
import { AuthExternalService } from './services/auth-external.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema: envValidationSchema }),
    TypeOrmModule.forRoot(typeOrmConfig()),
    TypeOrmModule.forFeature([
      Usuario,
      Perfil,
      Cliente,
      CondicionesComercialesCliente,
      Outbox,
      CanalComercial,
      Supervisor,
      Vendedor,
      Bodeguero,
      Transportista,
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'changeme',
      signOptions: { expiresIn: '15m' },
    }),
    HealthModule,
  ],
  controllers: [
    UsersController,
    UsersInternalController,
    ProfilesController,
    ClientsController,
    ClientsQueryController,
    ChannelsController,
    StaffController,
  ],
  providers: [
    UsersService,
    RoleProvisionService,
    ProfilesService,
    ChannelsService,
    ClientsService,
    OutboxService,
    StaffService,
    ZoneExternalService,
    AuthExternalService,
    JwtStrategy,
    JwtAuthGuard,
    {
      provide: S2S_CLIENT,
      useClass: HttpS2SAdapter,
    },
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
export class AppModule { }

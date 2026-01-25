import { Injectable, Logger, UnauthorizedException, ConflictException, Inject } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshDto } from './dto/refresh.dto';
import { LogoutDto } from './dto/logout.dto';
import { Repository, DataSource } from 'typeorm';
import { Credential } from './entities/credential.entity';
import { Session } from './entities/session.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { IS2SClient, S2S_CLIENT } from '../../common/interfaces/s2s-client.interface';
import { OutboxService } from '../outbox/outbox.service';
import { SessionService } from './services/session.service';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(Credential)
    private readonly credentialRepo: Repository<Credential>,
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    @Inject(S2S_CLIENT) private readonly s2sClient: IS2SClient,
    private readonly outboxService: OutboxService,
    private readonly sessionService: SessionService,
  ) {}

  async login(dto: LoginDto) {
    this.logger.log(`Login attempt for ${dto.email}`);

    const credential = (await this.credentialRepo.findOneBy({ email: dto.email })) as unknown as Credential | null;
    if (!credential) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await argon2.verify(credential.password, dto.password).catch(() => false);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const refreshToken = randomBytes(32).toString('hex');
    const refreshHash = await argon2.hash(refreshToken);

    const session = this.sessionRepo.create({
      usuario_id: credential.id,
      refresh_hash: refreshHash,
      direccion_ip: null,
      user_agent: null,
      dispositivo_meta: {},
      expira_en: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    } as any);
    await this.sessionRepo.save(session);

    // attempt to resolve real role from user-service (service-to-service)
    let role = 'cliente';
    try {
      const userServiceUrl = this.configService.get('USUARIOS_SERVICE_URL') || process.env.USUARIOS_SERVICE_URL || 'http://user-service:3000';
      const serviceToken = this.configService.get('SERVICE_TOKEN') || process.env.SERVICE_TOKEN || '';
      const user = await this.s2sClient.get<any>(userServiceUrl, `/v1/usuarios/${credential.id}`, serviceToken);
      if (user && user.rol) role = user.rol;
    } catch (e) {
      this.logger.log('Could not resolve role from user-service, using fallback');
    }

    const payload = { sub: credential.id, email: credential.email, role } as any;
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 900,
      usuario_id: credential.id,
      rol: role,
    };
  }

  // Validate credentials used by LocalStrategy
  async validateUser(email: string, password: string) {
    const credential = (await this.credentialRepo.findOneBy({ email })) as unknown as Credential | null;
    if (!credential) return null;
    const passwordMatches = await argon2.verify(credential.password, password).catch(() => false);
    if (!passwordMatches) return null;
    return { id: credential.id, email: credential.email };
  }

  // Create session + tokens for an already-validated user
  async loginWithUser(user: { id: string; email: string }) {
    const refreshToken = randomBytes(32).toString('hex');
    const refreshHash = await argon2.hash(refreshToken);

    const session = this.sessionRepo.create({
      usuario_id: user.id,
      refresh_hash: refreshHash,
      direccion_ip: null,
      user_agent: null,
      dispositivo_meta: {},
      expira_en: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    } as any);
    await this.sessionRepo.save(session);

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 900,
      usuario_id: user.id,
      rol: 'cliente',
    };
  }

  async register(dto: RegisterDto) {
    this.logger.log(`Registering ${dto.email}`);
    const passwordHash = await argon2.hash(dto.password);
    const id = uuidv4();

    return this.dataSource.transaction(async manager => {
      // save credential in auth DB
      try {
        await manager.getRepository(Credential).save({ id, email: dto.email, password: passwordHash } as any);
      } catch (e: any) {
        // unique violation -> email already registered
        if (e && e.code === '23505') {
          throw new ConflictException('Email already registered');
        }
        throw e;
      }

      // write outbox event for user-service to consume using OutboxService
      const payloadObj: any = { id, email: dto.email } as any;
      if ((dto as any).rol) payloadObj.rol = (dto as any).rol;
      if ((dto as any).perfil) payloadObj.perfil = (dto as any).perfil;
      if ((dto as any).cliente) payloadObj.cliente = (dto as any).cliente;
      if ((dto as any).vendedor) payloadObj.vendedor = (dto as any).vendedor;
      if ((dto as any).supervisor) payloadObj.supervisor = (dto as any).supervisor;
      if ((dto as any).bodeguero) payloadObj.bodeguero = (dto as any).bodeguero;

      await this.outboxService.createEvent(manager, {
        tipo: 'UsuarioRegistrado',
        claveAgregado: id,
        payload: payloadObj,
        agregado: 'auth',
      });

      return { id, email: dto.email };
    });
  }

  async refresh(dto: RefreshDto) {
    this.logger.log(`Refreshing token`);
    const sessions = await this.sessionRepo.find();

    for (const s of sessions) {
      try {
        const ok = await argon2.verify(s.refresh_hash, dto.refresh_token);
        if (ok && !s.revocado_en && new Date(s.expira_en) > new Date()) {
          const newRefresh = randomBytes(32).toString('hex');
          s.refresh_hash = await argon2.hash(newRefresh);
          await this.sessionRepo.save(s);

          const payload = { sub: s.usuario_id };
          const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
          return { access_token: accessToken, refresh_token: newRefresh, expires_in: 900 };
        }
      } catch (e) {
        // ignore verify errors
      }
    }

    throw new UnauthorizedException('Invalid refresh token');
  }

  async logout(dto: LogoutDto) {
    this.logger.log(`Logout requested`);
    const sessions = await this.sessionRepo.find();
    for (const s of sessions) {
      try {
        const ok = await argon2.verify(s.refresh_hash, dto.refresh_token);
        if (ok) {
          s.revocado_en = new Date();
          await this.sessionRepo.save(s);
          return;
        }
      } catch (e) {}
    }

    return;
  }

  async getSessions(usuarioId: string | null) {
    if (!usuarioId) return [];
    const sessions = await this.sessionRepo.find({ where: { usuario_id: usuarioId } });
    return sessions.map((s) => ({
      id: s.id,
      usuario_id: s.usuario_id,
      direccion_ip: s.direccion_ip,
      user_agent: s.user_agent,
      dispositivo_meta: s.dispositivo_meta,
      expira_en: s.expira_en,
      revocado_en: s.revocado_en,
      creado_en: s.creado_en,
    } as any));
  }
}


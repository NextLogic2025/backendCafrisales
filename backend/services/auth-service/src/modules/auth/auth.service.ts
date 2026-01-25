import { Injectable, Logger, UnauthorizedException, ConflictException, Inject, ForbiddenException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshDto } from './dto/refresh.dto';
import { LogoutDto } from './dto/logout.dto';
import { Repository, DataSource, MoreThan, IsNull } from 'typeorm';
import { Credential } from './entities/credential.entity';
import { Session } from './entities/session.entity';
import { LoginAttempt } from './entities/login-attempt.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { IS2SClient, S2S_CLIENT } from '../../common/interfaces/s2s-client.interface';
import { OutboxService } from '../outbox/outbox.service';
import { SessionService } from './services/session.service';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { UserExternalService } from '../../services/user-external.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(Credential)
    private readonly credentialRepo: Repository<Credential>,
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
    @InjectRepository(LoginAttempt)
    private readonly loginAttemptRepo: Repository<LoginAttempt>,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly userExternalService: UserExternalService,
    private readonly outboxService: OutboxService,
    private readonly sessionService: SessionService,
  ) { }

  private async resolveUserRole(userId: string): Promise<string> {
    try {
      const role = await this.userExternalService.getUserRole(userId);
      return role;
    } catch (e) {
      this.logger.warn(`No se pudo resolver rol desde user-service para ${userId}, usando fallback`);
      return 'cliente';
    }
  }

  private sanitizeIp(ip?: string): string {
    return ip && ip.trim() ? ip.trim() : '0.0.0.0';
  }

  private async recordLoginAttempt(email: string, ip: string, success: boolean, motivo?: string) {
    const attempt = this.loginAttemptRepo.create({
      email,
      direccion_ip: this.sanitizeIp(ip),
      exitoso: success,
      motivo_fallo: success ? null : motivo,
    } as any);
    try {
      await this.loginAttemptRepo.save(attempt);
    } catch (err) {
      this.logger.warn(`No se pudo guardar intento de login: ${err?.message || err}`);
    }
  }

  private async buildTokens(userId: string, email: string, role: string, meta?: { ip?: string; userAgent?: string; device?: any }) {
    const session = await this.sessionService.createSession(userId, { ip: meta?.ip, ua: meta?.userAgent, device: meta?.device });
    const payload = { sub: userId, email, role };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    return {
      access_token: accessToken,
      refresh_token: session.refreshToken,
      expires_in: 900,
      usuario_id: userId,
      rol: role,
    };
  }

  async login(dto: LoginDto) {
    this.logger.log(`Login attempt for ${dto.email}`);

    const user = await this.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const role = await this.resolveUserRole(user.id);
    return this.buildTokens(user.id, user.email, role);
  }

  // Validate credentials used by LocalStrategy
  async validateUser(email: string, password: string, meta?: { ip?: string; userAgent?: string }) {
    const ip = this.sanitizeIp(meta?.ip);
    const credential = (await this.credentialRepo.findOneBy({ email })) as unknown as Credential | null;
    if (!credential) {
      await this.recordLoginAttempt(email, ip, false, 'email_not_found');
      return null;
    }

    if (credential.estado !== 'activo') {
      await this.recordLoginAttempt(email, ip, false, `estado:${credential.estado}`);
      throw new ForbiddenException('Credencial no activa');
    }

    const passwordMatches = await argon2.verify(credential.password, password).catch(() => false);
    if (!passwordMatches) {
      await this.recordLoginAttempt(email, ip, false, 'password_mismatch');
      return null;
    }

    await this.recordLoginAttempt(email, ip, true);
    await this.credentialRepo.update(
      { id: credential.id } as any,
      { ultimo_login_en: new Date(), ultimo_login_ip: ip } as any,
    );

    return { id: credential.id, email: credential.email };
  }

  // Create session + tokens for an already-validated user
  async loginWithUser(user: { id: string; email: string }, meta?: { ip?: string; userAgent?: string; device?: any }) {
    const role = await this.resolveUserRole(user.id);
    return this.buildTokens(user.id, user.email, role, meta);
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
    const sessions = await this.sessionRepo.find({
      where: {
        revocado_en: IsNull(),
        expira_en: MoreThan(new Date()),
      },
    });

    for (const s of sessions) {
      try {
        const ok = await argon2.verify(s.refresh_hash, dto.refresh_token);
        if (ok && !s.revocado_en && new Date(s.expira_en) > new Date()) {
          const newRefresh = randomBytes(32).toString('hex');
          s.refresh_hash = await argon2.hash(newRefresh);
          await this.sessionRepo.save(s);

          const role = await this.resolveUserRole(s.usuario_id);
          const payload = { sub: s.usuario_id, role };
          const accessToken = this.jwtService.sign(payload, { expiresIn: '60m' });
          return { access_token: accessToken, refresh_token: newRefresh, expires_in: 60 * 60 };
        }
      } catch (e) {
        // ignore verify errors
      }
    }

    throw new UnauthorizedException('Invalid refresh token');
  }

  async logout(dto: LogoutDto) {
    this.logger.log(`Logout requested`);
    const sessions = await this.sessionRepo.find({
      where: {
        revocado_en: IsNull(),
      },
    });
    for (const s of sessions) {
      try {
        const ok = await argon2.verify(s.refresh_hash, dto.refresh_token);
        if (ok) {
          s.revocado_en = new Date();
          await this.sessionRepo.save(s);
          return;
        }
      } catch (e) { }
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


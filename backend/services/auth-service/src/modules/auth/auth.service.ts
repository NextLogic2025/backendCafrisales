import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshDto } from './dto/refresh.dto';
import { LogoutDto } from './dto/logout.dto';
import { Repository } from 'typeorm';
import { Credential } from './entities/credential.entity';
import { Session } from './entities/session.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
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

    const payload = { sub: credential.id, email: credential.email };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 900,
      usuario_id: credential.id,
      rol: 'cliente',
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
    const credential = this.credentialRepo.create({ id, email: dto.email, password: passwordHash } as any);
    const saved = (await this.credentialRepo.save(credential)) as unknown as Credential;
    return { id: saved.id, email: saved.email };
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


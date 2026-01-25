import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from '../entities/session.entity';
import * as crypto from 'crypto';
import * as argon2 from 'argon2';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
  ) {}

  async createSession(userId: string, metadata: { ip?: string; ua?: string; device?: any }) {
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const refreshHash = await argon2.hash(refreshToken);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const sesion = this.sessionRepo.create({
      usuario_id: userId,
      refresh_hash: refreshHash,
      direccion_ip: metadata.ip || null,
      user_agent: metadata.ua || null,
      dispositivo_meta: metadata.device || {},
      expira_en: expiresAt,
    } as any);
    const saved = await this.sessionRepo.save(sesion as any);

    return { refreshToken, sessionId: (saved as any).id };
  }
}

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';

type HeaderValue = string | string[] | undefined;

const extractBearerToken = (value: HeaderValue): string | null => {
  if (!value) return null;
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return trimmed.toLowerCase().startsWith('bearer ')
    ? trimmed.slice(7).trim()
    : trimmed;
};

const extractFromXAuthorization = (
  req: { headers?: Record<string, HeaderValue> } | undefined,
): string | null => {
  return extractBearerToken(req?.headers?.['x-authorization']);
};


/**
 * Estrategia JWT para validación de access tokens.
 * Extrae el token del header Authorization: Bearer <token>.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([ExtractJwt.fromAuthHeaderAsBearerToken(), extractFromXAuthorization]),
            secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
            ignoreExpiration: false,
        });
    }

    async validate(payload: { sub: string; email: string; role: string }) {
        return { userId: payload.sub, email: payload.email, role: payload.role };
    }
}

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';

/**
 * Estrategia JWT para validación de access tokens.
 * Extrae el token del header Authorization: Bearer <token>.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
            ignoreExpiration: false,
        });
    }

    async validate(payload: { sub: string; email: string; role: string }) {
        return { userId: payload.sub, email: payload.email, role: payload.role };
    }
}

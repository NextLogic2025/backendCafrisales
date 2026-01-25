import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'email', passReqToCallback: true });
  }

  async validate(req: any, email: string, password: string): Promise<any> {
    const ip =
      (req?.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req?.ip ||
      req?.connection?.remoteAddress ||
      '0.0.0.0';

    const user = await this.authService.validateUser(email, password, { ip, userAgent: req?.headers?.['user-agent'] });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    return user;
  }
}

import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  ForbiddenException,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshDto } from './dto/refresh.dto';
import { LogoutDto } from './dto/logout.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { JwtOrServiceGuard } from '../../common/guards/jwt-or-service.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Request() req: any) {
    // LocalStrategy validated and attached `req.user`
    const meta = {
      ip:
        (req?.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        req?.ip ||
        req?.connection?.remoteAddress ||
        undefined,
      userAgent: req?.headers?.['user-agent'],
    };
    return this.authService.loginWithUser(req.user, meta);
  }

  @UseGuards(JwtOrServiceGuard)
  @Post('register')
  async register(@Body() dto: RegisterDto, @GetUser() user: any, @Req() req: any) {
    const isServiceAuth = !!req?.serviceAuth;
    if (!isServiceAuth) {
      const role = (user?.role || user?.rol || '').toLowerCase();
      const allowed = ['admin', 'supervisor', 'staff'];
      if (!allowed.includes(role)) {
        throw new ForbiddenException('No autorizado para crear usuarios');
      }
    }

    const payload: RegisterDto = {
      ...dto,
      creado_por: isServiceAuth ? dto.creado_por : (user?.userId || user?.id || dto.creado_por),
      usuario_id: isServiceAuth ? dto.usuario_id : undefined,
    } as RegisterDto;

    return this.authService.register(payload, { allowCustomId: isServiceAuth });
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto);
  }

  @Post('logout')
  async logout(@Body() dto: LogoutDto) {
    await this.authService.logout(dto);
    return { statusCode: 204 };
  }

  @UseGuards(JwtAuthGuard)
  @Get('sesiones')
  async sesiones(@GetUser() user: any) {
    return this.authService.getSessions(user?.userId || user?.id || null);
  }
}

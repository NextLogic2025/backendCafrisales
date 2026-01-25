import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshDto } from './dto/refresh.dto';
import { LogoutDto } from './dto/logout.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../../common/decorators/get-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
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

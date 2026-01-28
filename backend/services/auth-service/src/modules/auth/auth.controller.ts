import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  ForbiddenException,
  Req,
  HttpCode,
  HttpStatus,
  Put,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshDto } from './dto/refresh.dto';
import { LogoutDto } from './dto/logout.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { AuthUser, GetUser } from '../../common/decorators/get-user.decorator';
import { JwtOrServiceGuard } from '../../common/guards/jwt-or-service.guard';
import { UpdateEmailDto, UpdatePasswordDto } from './dto/update-credentials.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Request() req: any) {
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
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto, @GetUser() user: AuthUser | undefined, @Req() req: any) {
    const isServiceAuth = !!req?.serviceAuth;
    if (!isServiceAuth) {
      const role = (user?.role || '').toLowerCase();
      const allowed = ['admin', 'supervisor', 'staff'];
      if (!allowed.includes(role)) {
        throw new ForbiddenException('No autorizado para crear usuarios');
      }
    }

    const payload: RegisterDto = {
      ...dto,
      creado_por: isServiceAuth ? dto.creado_por : (user?.userId || dto.creado_por),
      usuario_id: isServiceAuth ? dto.usuario_id : undefined,
    } as RegisterDto;

    return this.authService.register(payload, { allowCustomId: isServiceAuth });
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Body() dto: LogoutDto) {
    await this.authService.logout(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('sesiones')
  async sesiones(@GetUser() user: AuthUser | undefined) {
    return this.authService.getSessions(user?.userId ?? null);
  }

  @UseGuards(JwtAuthGuard)
  @Put('usuarios/:id/password')
  async updatePassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePasswordDto,
    @GetUser() user: AuthUser | undefined,
  ) {
    const role = (user?.role || '').toLowerCase();
    if (!['admin', 'supervisor', 'staff'].includes(role)) {
      throw new ForbiddenException('No autorizado para actualizar credenciales');
    }
    return this.authService.updatePassword(id, dto.password, user?.userId ?? null);
  }

  @UseGuards(JwtAuthGuard)
  @Put('usuarios/:id/email')
  async updateEmail(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmailDto,
    @GetUser() user: AuthUser | undefined,
  ) {
    const role = (user?.role || '').toLowerCase();
    if (!['admin', 'supervisor', 'staff'].includes(role)) {
      throw new ForbiddenException('No autorizado para actualizar credenciales');
    }
    return this.authService.updateEmail(id, dto.email, user?.userId ?? null);
  }
}

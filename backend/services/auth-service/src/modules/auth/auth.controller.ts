import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  ForbiddenException,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  Put,
  Param,
  ParseUUIDPipe,
  Header,
} from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Response } from 'express';
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

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Header('X-Content-Type-Options', 'nosniff')
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso',
    schema: {
      properties: {
        accessToken: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  @ApiResponse({ status: 429, description: 'Demasiados intentos' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
    @Request() req: any,
  ) {
    const meta = {
      ip:
        (req?.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        req?.ip ||
        req?.connection?.remoteAddress ||
        undefined,
      userAgent: req?.headers?.['user-agent'],
    };
    const result = await this.authService.login(loginDto);

    // Set refresh token in httpOnly cookie
    response.cookie('refreshToken', result.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    });

    return {
      accessToken: result.access_token,
      user: {
        id: result.usuario_id,
        email: loginDto.email,
        role: result.rol,
      },
    };
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
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Refrescar token de acceso' })
  @ApiResponse({ status: 200, description: 'Token refrescado' })
  @ApiResponse({ status: 401, description: 'Refresh token inválido' })
  async refresh(@Req() req: any, @Body() dto: RefreshDto) {
    const refreshToken = req.cookies['refreshToken'] || dto.refresh_token;
    if (!refreshToken) {
      throw new ForbiddenException('No refresh token provided');
    }
    return this.authService.refresh({ refresh_token: refreshToken });
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cerrar sesión' })
  @ApiResponse({ status: 204, description: 'Logout exitoso' })
  async logout(
    @Req() req: any,
    @Res({ passthrough: true }) response: Response,
    @Body() dto: LogoutDto,
  ) {
    // Attempt to invalidate by JTI if available in req.user, otherwise fallback to DTO if needed
    // Assuming req.user is populated by JwtAuthGuard
    if (req.user && req.user.jti) {
      await this.authService.invalidateToken(req.user.jti);
    }

    // Also call existing logout logic which revokes by refresh token hash if provided
    if (dto && dto.refresh_token) {
      await this.authService.logout(dto);
    }

    // Clear cookie
    response.clearCookie('refreshToken');
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

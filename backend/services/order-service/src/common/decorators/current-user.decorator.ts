import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RolUsuario } from '../constants/rol-usuario.enum';

/**
 * Interface que representa el payload del usuario autenticado (JWT).
 * Debe coincidir con lo que JwtStrategy almacena en request.user.
 */
export interface AuthUser {
  userId: string;
  email?: string;
  role?: RolUsuario;
}

/**
 * Decorador para extraer el usuario autenticado del request.
 * Uso: @CurrentUser() user: AuthUser
 */
export const CurrentUser = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        return request.user as AuthUser | undefined;
    },
);

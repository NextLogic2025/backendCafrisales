import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Interface que representa el payload del usuario autenticado (JWT).
 * Debe coincidir con lo que JwtStrategy almacena en request.user.
 */
export interface AuthUser {
  userId: string;
  email?: string;
  role?: string;
}

/**
 * Decorador para extraer el usuario autenticado del request.
 * Uso: @GetUser() user: AuthUser
 */
export const GetUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user as AuthUser | undefined;
});

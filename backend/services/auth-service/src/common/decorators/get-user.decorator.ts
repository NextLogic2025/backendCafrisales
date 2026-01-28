import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Representa el usuario autenticado extraído del JWT.
 * Contiene los claims mínimos necesarios para autorización.
 */
export interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

/**
 * Decorator que extrae el usuario autenticado de la request.
 * Retorna undefined si no hay usuario (requiere JwtAuthGuard previo).
 */
export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthUser | undefined => {
    const req = ctx.switchToHttp().getRequest();
    return req.user as AuthUser | undefined;
  },
);

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Representa el usuario autenticado extraído del JWT.
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
export const CurrentUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): AuthUser | undefined => {
        const request = ctx.switchToHttp().getRequest();
        return request.user as AuthUser | undefined;
    },
);

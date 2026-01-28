import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RolUsuario } from '../constants/rol-usuario.enum';

/**
 * Representa el usuario autenticado extraído del JWT.
 * Contiene los claims mínimos necesarios para autorización.
 */
export interface AuthUser {
    userId: string;
    id?: string;
    email: string;
    role: RolUsuario;
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

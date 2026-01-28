import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RolUsuario } from '../constants/rol-usuario.enum';

/**
 * Representa la información del usuario autenticado extraída del JWT.
 * Usar este tipo en lugar de 'any' garantiza tipado fuerte en controladores.
 */
export interface AuthUser {
    /** ID único del usuario (UUID) */
    userId: string;
    /** Alias: algunos guards usan 'id' en lugar de 'userId' */
    id?: string;
    /** Email del usuario autenticado */
    email: string;
    /** Rol del usuario para control de acceso */
    role: RolUsuario;
}

/**
 * Decorador que extrae el usuario autenticado del request.
 * Requiere que JwtAuthGuard haya procesado la petición previamente.
 */
export const CurrentUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): AuthUser | undefined => {
        const request = ctx.switchToHttp().getRequest();
        return request.user;
    },
);

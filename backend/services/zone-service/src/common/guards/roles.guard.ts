import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RolUsuario } from '../enums/rol-usuario.enum';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.get<RolUsuario[]>(ROLES_KEY, context.getHandler());
        if (!requiredRoles || requiredRoles.length === 0) return true; // no role restriction

        const req = context.switchToHttp().getRequest();

        // allow service-to-service calls using shared SERVICE_TOKEN header
        const svcToken = req.headers['x-service-token'] || req.headers['service-token'];
        if (svcToken && svcToken === process.env.SERVICE_TOKEN) return true;

        const user = req.user as any;
        if (!user || !user.role) throw new ForbiddenException('Missing role in token');

        if (requiredRoles.includes(user.role)) return true;

        throw new ForbiddenException('Insufficient role');
    }
}

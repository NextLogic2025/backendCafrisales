import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ServiceTokenGuard implements CanActivate {
    constructor(private readonly configService: ConfigService) { }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const token = request.headers['x-service-token'];

        const expectedToken =
            this.configService.get('SERVICE_TOKEN') ||
            process.env.SERVICE_TOKEN;

        if (!token || token !== expectedToken) {
            throw new UnauthorizedException('Invalid service token');
        }

        return true;
    }
}

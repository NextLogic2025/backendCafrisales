import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtOrServiceGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const svcToken = req?.headers?.['x-service-token'] || req?.headers?.['service-token'];
    if (svcToken && svcToken === process.env.SERVICE_TOKEN) {
      req.serviceAuth = true;
      return true;
    }
    return super.canActivate(context);
  }
}

import { ConfigService } from '@nestjs/config';

export function getServiceUrls(config: ConfigService) {
  return {
    AUTH_URL: config.get('AUTH_URL') || process.env.AUTH_URL || 'http://auth-service:3000',
    USERS_URL: config.get('USUARIOS_URL') || process.env.USUARIOS_URL || 'http://user-service:3000',
    SERVICE_TOKEN: config.get('SERVICE_TOKEN') || process.env.SERVICE_TOKEN || '',
  };
}

import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class AuthExternalService {
  private readonly logger = new Logger(AuthExternalService.name);
  private readonly authServiceUrl: string;
  private readonly serviceToken: string;

  constructor(private readonly configService: ConfigService) {
    this.authServiceUrl =
      this.configService.get('AUTH_SERVICE_URL') ||
      process.env.AUTH_SERVICE_URL ||
      process.env.AUTH_URL ||
      'http://auth-service:3000';

    this.serviceToken =
      this.configService.get('SERVICE_TOKEN') ||
      process.env.SERVICE_TOKEN ||
      '';
  }

  async registerUser(payload: any, authHeader?: string) {
    const headers: Record<string, string> = {
      ...(authHeader ? { Authorization: authHeader } : {}),
      ...(this.serviceToken ? { 'x-service-token': this.serviceToken } : {}),
    };

    try {
      const url = `${this.authServiceUrl}/api/auth/register`;
      const res = await axios.post(url, payload, { headers, timeout: 5000 });
      return res.data;
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 409) {
        throw new ConflictException('Credencial ya registrada');
      }
      this.logger.warn(`Auth register failed: ${err?.message || err}`);
      throw err;
    }
  }
}

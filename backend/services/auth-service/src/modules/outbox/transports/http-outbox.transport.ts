import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IOutboxTransport } from '../interfaces/outbox-transport.interface';
import { IS2SClient, S2S_CLIENT } from '../../../common/interfaces/s2s-client.interface';

@Injectable()
export class HttpOutboxTransport implements IOutboxTransport {
  private readonly logger = new Logger(HttpOutboxTransport.name);

  constructor(
    @Inject(S2S_CLIENT)
    private readonly s2sClient: IS2SClient,
    private readonly configService: ConfigService,
  ) {}

  async dispatch(evento: any): Promise<void> {
    const userServiceUrl =
      this.configService.get('USUARIOS_SERVICE_URL') ||
      process.env.USUARIOS_SERVICE_URL ||
      process.env.USUARIOS_URL ||
      'http://user-service:3000';
    const serviceToken = this.configService.get('SERVICE_TOKEN') || process.env.SERVICE_TOKEN || '';

    if (evento.tipo_evento === 'UsuarioRegistrado') {
      const payload = JSON.parse(JSON.stringify(evento.payload));
      if (payload.rol === 'usuario') payload.rol = 'cliente';

      // Use the S2S client abstraction instead of axios directly (DIP)
      try {
        await this.s2sClient.post(userServiceUrl, '/api/internal/usuarios/sync', payload, serviceToken);
      } catch (err) {
        this.logger.error(`Failed dispatching outbox ${evento.id}: ${err?.message || err}`);
        throw err;
      }

      return;
    }

    this.logger.warn(`Evento no manejado por transporte HTTP: ${evento.tipo_evento}`);
  }
}

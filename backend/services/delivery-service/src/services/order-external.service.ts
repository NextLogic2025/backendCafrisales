import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IS2SClient, S2S_CLIENT } from '../common/interfaces/s2s-client.interface';

@Injectable()
export class OrderExternalService {
    private readonly logger = new Logger(OrderExternalService.name);
    private readonly orderServiceUrl: string;
    private readonly serviceToken: string;

    constructor(
        private readonly configService: ConfigService,
        @Inject(S2S_CLIENT) private readonly s2sClient: IS2SClient,
    ) {
        this.orderServiceUrl =
            this.configService.get('ORDER_SERVICE_URL') ||
            process.env.ORDER_SERVICE_URL ||
            'http://order-service:3000';

        this.serviceToken =
            this.configService.get('SERVICE_TOKEN') ||
            process.env.SERVICE_TOKEN ||
            '';
    }

    async updateOrderStatus(pedidoId: string, estado: string, actorId?: string): Promise<boolean> {
        try {
            await this.s2sClient.post(
                this.orderServiceUrl,
                `/api/internal/pedidos/${pedidoId}/estado`,
                { estado, cambiado_por_id: actorId },
                this.serviceToken,
            );
            return true;
        } catch (error: any) {
            this.logger.error(`Failed to update order ${pedidoId}: ${error.message}`);
            return false;
        }
    }
}

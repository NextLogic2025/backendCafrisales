import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Inject } from '@nestjs/common';
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

    /**
     * Get order information by ID
     */
    async getOrderById(orderId: string): Promise<any> {
        try {
            const order = await this.s2sClient.get<any>(
                this.orderServiceUrl,
                `/api/v1/internal/pedidos/${orderId}`,
                this.serviceToken,
            );
            return order;
        } catch (error) {
            this.logger.warn(`Failed to fetch order ${orderId} from order-service: ${error.message}`);
            return null;
        }
    }
}

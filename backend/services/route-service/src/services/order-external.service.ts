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

    async getOrderById(orderId: string): Promise<any> {
        try {
            return await this.s2sClient.get<any>(
                this.orderServiceUrl,
                `/api/v1/internal/pedidos/${orderId}`,
                this.serviceToken,
            );
        } catch (error) {
            this.logger.warn(`Failed to fetch order ${orderId}: ${error.message}`);
            return null;
        }
    }

    async getOrdersByIds(orderIds: string[]): Promise<any[]> {
        const results: any[] = [];
        for (const orderId of orderIds) {
            const order = await this.getOrderById(orderId);
            if (order) {
                results.push(order);
            }
        }
        return results;
    }

    async updateOrdersStatus(
        pedidoIds: string[],
        estado: string,
        actorId?: string,
    ): Promise<{ actualizados: number } | null> {
        try {
            return await this.s2sClient.post<{ actualizados: number }>(
                this.orderServiceUrl,
                `/api/v1/internal/pedidos/batch/estado`,
                { pedido_ids: pedidoIds, estado, cambiado_por_id: actorId },
                this.serviceToken,
            );
        } catch (error: any) {
            this.logger.warn(
                `Failed to update orders batch: ${error.message} (status=${error?.response?.status}) data=${JSON.stringify(error?.response?.data)}`,
            );
            return null;
        }
    }
}

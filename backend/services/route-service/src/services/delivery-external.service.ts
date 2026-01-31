import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IS2SClient, S2S_CLIENT } from '../common/interfaces/s2s-client.interface';

export interface CreateDeliveriesBatchDto {
    rutero_logistico_id: string;
    transportista_id: string;
    paradas: Array<{ pedido_id: string; orden: number }>;
}

export interface CreateDeliveriesBatchResponse {
    entregas_creadas: number;
}

@Injectable()
export class DeliveryExternalService {
    private readonly logger = new Logger(DeliveryExternalService.name);
    private readonly deliveryServiceUrl: string;
    private readonly serviceToken: string;

    constructor(
        private readonly configService: ConfigService,
        @Inject(S2S_CLIENT) private readonly s2sClient: IS2SClient,
    ) {
        this.deliveryServiceUrl =
            this.configService.get('DELIVERY_SERVICE_URL') ||
            process.env.DELIVERY_SERVICE_URL ||
            'http://delivery-service:3000';

        this.serviceToken =
            this.configService.get('SERVICE_TOKEN') ||
            process.env.SERVICE_TOKEN ||
            '';
    }

    async createDeliveriesBatch(dto: CreateDeliveriesBatchDto): Promise<CreateDeliveriesBatchResponse | null> {
        try {
            this.logger.log(`Creating ${dto.paradas.length} deliveries for rutero ${dto.rutero_logistico_id}`);
            this.logger.debug(`Deliveries batch payload: ${JSON.stringify(dto)}`);
            const result = await this.s2sClient.post<CreateDeliveriesBatchResponse>(
                this.deliveryServiceUrl,
                '/api/entregas/batch',
                dto,
                this.serviceToken,
            );
            this.logger.log(`Created ${result ? result.entregas_creadas : 0} deliveries`);
            return result;
        } catch (error) {
            this.logger.error(`Failed to create deliveries batch: ${error.message}`);
            return null;
        }
    }
}

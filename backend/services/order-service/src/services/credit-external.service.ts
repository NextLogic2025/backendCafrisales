import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Inject } from '@nestjs/common';
import { IS2SClient, S2S_CLIENT } from '../common/interfaces/s2s-client.interface';

@Injectable()
export class CreditExternalService {
    private readonly logger = new Logger(CreditExternalService.name);
    private readonly creditServiceUrl: string;
    private readonly serviceToken: string;

    constructor(
        private readonly configService: ConfigService,
        @Inject(S2S_CLIENT) private readonly s2sClient: IS2SClient,
    ) {
        this.creditServiceUrl =
            this.configService.get('CREDIT_SERVICE_URL') ||
            process.env.CREDIT_SERVICE_URL ||
            'http://credit-service:3000';

        this.serviceToken =
            this.configService.get('SERVICE_TOKEN') ||
            process.env.SERVICE_TOKEN ||
            '';
    }

    async getCreditByOrder(pedidoId: string): Promise<any | null> {
        try {
            const credit = await this.s2sClient.get<any>(
                this.creditServiceUrl,
                `/api/v1/credits/internal/order/${pedidoId}`,
                this.serviceToken,
            );
            return credit;
        } catch (error) {
            this.logger.warn(
                `Failed to fetch credit by order ${pedidoId} from credit-service: ${error.message}`,
            );
            return null;
        }
    }
}

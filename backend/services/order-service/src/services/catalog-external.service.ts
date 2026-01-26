import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Inject } from '@nestjs/common';
import { IS2SClient, S2S_CLIENT } from '../common/interfaces/s2s-client.interface';

@Injectable()
export class CatalogExternalService {
    private readonly logger = new Logger(CatalogExternalService.name);
    private readonly catalogServiceUrl: string;
    private readonly serviceToken: string;

    constructor(
        private readonly configService: ConfigService,
        @Inject(S2S_CLIENT) private readonly s2sClient: IS2SClient,
    ) {
        this.catalogServiceUrl =
            this.configService.get('CATALOG_SERVICE_URL') ||
            process.env.CATALOG_SERVICE_URL ||
            'http://catalog-service:3000';

        this.serviceToken =
            this.configService.get('SERVICE_TOKEN') ||
            process.env.SERVICE_TOKEN ||
            '';
    }

    /**
     * Get SKU information by ID
     */
    async getSkuById(skuId: string): Promise<any> {
        try {
            const sku = await this.s2sClient.get<any>(
                this.catalogServiceUrl,
                `/api/internal/skus/${skuId}`,
                this.serviceToken,
            );
            return sku;
        } catch (error) {
            this.logger.warn(`Failed to fetch SKU ${skuId} from catalog-service: ${error.message}`);
            return null;
        }
    }

    /**
     * Get multiple SKUs by IDs
     */
    async getSkusByIds(skuIds: string[]): Promise<any[]> {
        const promises = skuIds.map((id) => this.getSkuById(id));
        const results = await Promise.allSettled(promises);
        return results
            .filter((r) => r.status === 'fulfilled' && r.value !== null)
            .map((r: any) => r.value);
    }
}

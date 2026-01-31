import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IS2SClient, S2S_CLIENT } from '../common/interfaces/s2s-client.interface';
import { Inject } from '@nestjs/common';

@Injectable()
export class ZoneExternalService {
    private readonly logger = new Logger(ZoneExternalService.name);
    private readonly zoneServiceUrl: string;
    private readonly serviceToken: string;

    constructor(
        private readonly configService: ConfigService,
        @Inject(S2S_CLIENT) private readonly s2sClient: IS2SClient,
    ) {
        this.zoneServiceUrl =
            this.configService.get('ZONE_SERVICE_URL') ||
            process.env.ZONE_SERVICE_URL ||
            process.env.ZONAS_URL ||
            'http://zone-service:3000';

        this.serviceToken =
            this.configService.get('SERVICE_TOKEN') ||
            process.env.SERVICE_TOKEN ||
            '';
    }

    /**
     * Get zone information by zone ID
     */
    async getZoneById(zoneId: string): Promise<any> {
        try {
            const zone = await this.s2sClient.get<any>(
                this.zoneServiceUrl,
                `/api/v1/internal/zones/${zoneId}`,
                this.serviceToken,
            );
            return zone;
        } catch (error) {
            this.logger.warn(`Failed to fetch zone ${zoneId} from zone-service: ${error.message}`);
            return null;
        }
    }

    /**
     * Get multiple zones by IDs
     */
    async getZonesByIds(zoneIds: string[]): Promise<any[]> {
        try {
            const zones = await Promise.all(
                zoneIds.map(id => this.getZoneById(id))
            );
            return zones.filter(z => z !== null);
        } catch (error) {
            this.logger.warn(`Failed to fetch zones from zone-service: ${error.message}`);
            return [];
        }
    }
}

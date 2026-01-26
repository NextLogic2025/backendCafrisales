import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IS2SClient, S2S_CLIENT } from '../common/interfaces/s2s-client.interface';

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
            'http://zone-service:3000';

        this.serviceToken =
            this.configService.get('SERVICE_TOKEN') ||
            process.env.SERVICE_TOKEN ||
            '';
    }

    async getZoneById(zoneId: string): Promise<any> {
        try {
            return await this.s2sClient.get<any>(
                this.zoneServiceUrl,
                `/api/internal/zones/${zoneId}`,
                this.serviceToken,
            );
        } catch (error) {
            this.logger.warn(`Failed to fetch zone ${zoneId}: ${error.message}`);
            return null;
        }
    }
}

import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IS2SClient, S2S_CLIENT } from '../common/interfaces/s2s-client.interface';

@Injectable()
export class UserExternalService {
    private readonly logger = new Logger(UserExternalService.name);
    private readonly userServiceUrl: string;
    private readonly serviceToken: string;

    constructor(
        private readonly configService: ConfigService,
        @Inject(S2S_CLIENT) private readonly s2sClient: IS2SClient,
    ) {
        this.userServiceUrl =
            this.configService.get('USER_SERVICE_URL') ||
            process.env.USER_SERVICE_URL ||
            'http://user-service:3000';

        this.serviceToken =
            this.configService.get('SERVICE_TOKEN') ||
            process.env.SERVICE_TOKEN ||
            '';
    }

    async getUserById(userId: string): Promise<any> {
        try {
            return await this.s2sClient.get<any>(
                this.userServiceUrl,
                `/api/internal/usuarios/${userId}`,
                this.serviceToken,
            );
        } catch (error) {
            this.logger.warn(`Failed to fetch user ${userId}: ${error.message}`);
            return null;
        }
    }

    async isSeller(userId: string): Promise<boolean> {
        const user = await this.getUserById(userId);
        return user?.rol === 'vendedor';
    }

    async isTransporter(userId: string): Promise<boolean> {
        const user = await this.getUserById(userId);
        return user?.rol === 'transportista';
    }
}

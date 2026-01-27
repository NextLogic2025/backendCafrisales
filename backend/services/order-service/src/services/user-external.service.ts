import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Inject } from '@nestjs/common';
import { IS2SClient, S2S_CLIENT } from '../common/interfaces/s2s-client.interface';

export interface ClienteCondiciones {
    permite_negociacion: boolean;
    max_descuento_porcentaje?: number;
}

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

    /**
     * Get user information by user ID
     */
    async getUserById(userId: string): Promise<any> {
        try {
            const user = await this.s2sClient.get<any>(
                this.userServiceUrl,
                `/api/internal/usuarios/${userId}`,
                this.serviceToken,
            );
            return user;
        } catch (error) {
            this.logger.warn(`Failed to fetch user ${userId} from user-service: ${error.message}`);
            return null;
        }
    }

    /**
     * Get client information
     */
    async getClientById(clientId: string): Promise<any> {
        try {
            const client = await this.s2sClient.get<any>(
                this.userServiceUrl,
                `/api/internal/clientes/${clientId}`,
                this.serviceToken,
            );
            return client;
        } catch (error) {
            this.logger.warn(`Failed to fetch client ${clientId} from user-service: ${error.message}`);
            return null;
        }
    }

    /**
     * Get client negotiation conditions
     */
    async getClientConditions(clientId: string): Promise<ClienteCondiciones | null> {
        try {
            const conditions = await this.s2sClient.get<ClienteCondiciones>(
                this.userServiceUrl,
                `/api/internal/clientes/${clientId}/condiciones`,
                this.serviceToken,
            );
            return conditions;
        } catch (error) {
            this.logger.warn(
                `Failed to fetch client conditions for ${clientId} from user-service: ${error.message}`,
            );
            return null;
        }
    }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IS2SClient, S2S_CLIENT } from '../common/interfaces/s2s-client.interface';
import { Inject } from '@nestjs/common';

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
            this.configService.get('USUARIOS_SERVICE_URL') ||
            process.env.USUARIOS_SERVICE_URL ||
            process.env.USUARIOS_URL ||
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
                `/api/v1/internal/usuarios/${userId}`,
                this.serviceToken,
            );
            return user;
        } catch (error) {
            this.logger.warn(`Failed to fetch user ${userId} from user-service: ${error.message}`);
            return null;
        }
    }

    /**
     * Get user role by user ID
     */
    async getUserRole(userId: string): Promise<string> {
        const user = await this.getUserById(userId);
        return user?.rol || 'cliente';
    }

    async syncUser(payload: any): Promise<any> {
        if (!this.serviceToken) {
            const userId = payload?.id || payload?.usuario_id || 'desconocido';
            this.logger.warn(`SERVICE_TOKEN no configurado, omitiendo sincronización para ${userId}`);
            return null;
        }

        try {
            return await this.s2sClient.post<any>(
                this.userServiceUrl,
                '/api/v1/internal/usuarios/sync',
                payload,
                this.serviceToken,
            );
        } catch (error) {
            const userId = payload?.id || payload?.usuario_id || 'desconocido';
            this.logger.warn(`Failed to sync user ${userId} with user-service: ${error?.message || error}`);
            throw error;
        }
    }
}

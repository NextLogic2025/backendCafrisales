import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OrderExternalService } from '../../services/order-external.service';
import { UserExternalService } from '../../services/user-external.service';
import { HttpS2SAdapter } from '../../common/adapters/http-s2s.adapter';
import { S2S_CLIENT } from '../../common/interfaces/s2s-client.interface';

@Global()
@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: S2S_CLIENT,
            useClass: HttpS2SAdapter,
        },
        OrderExternalService,
        UserExternalService,
    ],
    exports: [OrderExternalService, UserExternalService],
})
export class ExternalServicesModule {}

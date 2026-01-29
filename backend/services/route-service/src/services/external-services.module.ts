import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { UserExternalService } from './user-external.service';
import { ZoneExternalService } from './zone-external.service';
import { OrderExternalService } from './order-external.service';
import { DeliveryExternalService } from './delivery-external.service';
import { HttpS2SAdapter } from '../common/adapters/http-s2s.adapter';
import { S2S_CLIENT } from '../common/interfaces/s2s-client.interface';

@Module({
    imports: [
        HttpModule.register({
            timeout: 5000,
            maxRedirects: 3,
        }),
        ConfigModule,
    ],
    providers: [
        {
            provide: S2S_CLIENT,
            useClass: HttpS2SAdapter,
        },
        UserExternalService,
        ZoneExternalService,
        OrderExternalService,
        DeliveryExternalService,
    ],
    exports: [
        S2S_CLIENT,
        UserExternalService,
        ZoneExternalService,
        OrderExternalService,
        DeliveryExternalService,
    ],
})
export class ExternalServicesModule {}

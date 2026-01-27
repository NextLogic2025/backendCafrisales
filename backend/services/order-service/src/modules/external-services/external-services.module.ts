import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CatalogExternalService } from '../../services/catalog-external.service';
import { UserExternalService } from '../../services/user-external.service';
import { ZoneExternalService } from '../../services/zone-external.service';
import { CreditExternalService } from '../../services/credit-external.service';
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
        CatalogExternalService,
        UserExternalService,
        ZoneExternalService,
        CreditExternalService,
    ],
    exports: [CatalogExternalService, UserExternalService, ZoneExternalService, CreditExternalService],
})
export class ExternalServicesModule {}

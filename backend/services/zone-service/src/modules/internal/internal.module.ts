import { Module } from '@nestjs/common';
import { InternalZonesController } from './internal-zones.controller';
import { ZonesModule } from '../zones/zones.module';

@Module({
    imports: [ZonesModule],
    controllers: [InternalZonesController],
})
export class InternalModule { }

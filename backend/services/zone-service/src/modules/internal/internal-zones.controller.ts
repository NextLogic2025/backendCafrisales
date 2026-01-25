import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ServiceTokenGuard } from '../../common/guards/service-token.guard';
import { ZonesService } from '../zones/zones.service';

@Controller('internal/zones')
@UseGuards(ServiceTokenGuard)
export class InternalZonesController {
    constructor(private readonly zonesService: ZonesService) { }

    @Get(':id')
    async getZoneById(@Param('id') id: string) {
        return this.zonesService.findOne(id);
    }
}

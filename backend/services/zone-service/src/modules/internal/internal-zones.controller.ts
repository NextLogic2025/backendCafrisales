import { Controller, Get, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ServiceTokenGuard } from '../../common/guards/service-token.guard';
import { ZonesService } from '../zones/zones.service';

/**
 * Controlador interno para comunicación S2S (servicio a servicio).
 * No requiere JWT de usuario, solo ServiceTokenGuard.
 */
@Controller('internal/zones')
@UseGuards(ServiceTokenGuard)
export class InternalZonesController {
    constructor(private readonly zonesService: ZonesService) { }

    @Get(':id')
    async getZoneById(@Param('id', ParseUUIDPipe) id: string) {
        return this.zonesService.findOne(id);
    }
}

import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';
import { CreateDeliveriesBatchDto } from './dto/create-delivery.dto';
import { ServiceTokenGuard } from '../common/guards/service-token.guard';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('deliveries.internal')
@Controller({ path: 'entregas', version: '1' })
@UseGuards(ServiceTokenGuard)
export class DeliveriesInternalController {
    constructor(private readonly deliveriesService: DeliveriesService) { }

    @Post('batch')
    createBatch(@Body() dto: CreateDeliveriesBatchDto) {
        return this.deliveriesService.createBatch(dto);
    }
}

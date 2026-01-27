import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { HistoryService } from './history.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('creditos')
export class HistoryController {
    constructor(private readonly historyService: HistoryService) {}

    @Get(':id/historial')
    @UseGuards(JwtAuthGuard)
    list(@Param('id') aprobacionCreditoId: string) {
        return this.historyService.listByCredit(aprobacionCreditoId);
    }
}

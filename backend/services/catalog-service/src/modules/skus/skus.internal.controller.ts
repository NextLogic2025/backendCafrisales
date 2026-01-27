import { Controller, Get, Param, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SkusService } from './skus.service';

@Controller('internal/skus')
@UseGuards(RolesGuard)
export class SkusInternalController {
  constructor(private readonly skusService: SkusService) {}

  @Get(':id')
  async getById(@Param('id') id: string, @Req() req: any) {
    this.assertServiceToken(req);
    return this.skusService.findOne(id);
  }

  private assertServiceToken(req: any) {
    const svcToken = req.headers['x-service-token'] || req.headers['service-token'];
    if (!svcToken || svcToken !== process.env.SERVICE_TOKEN) {
      throw new ForbiddenException('Servicio no autorizado');
    }
  }
}

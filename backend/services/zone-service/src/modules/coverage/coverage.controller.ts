import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CoverageService } from './coverage.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CheckPointDto } from './dto/check-point.dto';

@ApiTags('Coverage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('coverage')
export class CoverageController {
    constructor(private readonly coverageService: CoverageService) { }

    @Post('check-point')
    async checkPoint(@Body() body: CheckPointDto) {
        const zone = await this.coverageService.findZoneByPoint(body.lat, body.lon);
        return {
            covered: !!zone,
            zone,
        };
    }
}

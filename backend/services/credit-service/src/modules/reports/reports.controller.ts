import { Controller, Get, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolUsuario } from '../../common/constants/rol-usuario.enum';

@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get('portfolio')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    getPortfolioSummary() {
        return this.reportsService.getPortfolioSummary();
    }

    @Get('active-credits')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR, RolUsuario.VENDEDOR)
    getActiveCredits() {
        return this.reportsService.getActiveCredits();
    }

    @Get('overdue')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    getOverdueCredits() {
        return this.reportsService.getOverdueCredits();
    }
}

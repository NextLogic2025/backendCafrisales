import { Body, Controller, Get, Post, Put, Param, Query, UseGuards } from '@nestjs/common';
import { CreditsService } from './credits.service';
import { AprobarCreditoDto } from './dto/aprobar-credito.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ServiceTokenGuard } from '../../common/guards/service-token.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolUsuario } from '../../common/constants/rol-usuario.enum';
import { EstadoCredito } from '../../common/constants/credit-status.enum';
import { OrigenCredito } from '../../common/constants/credit-origin.enum';

@Controller('creditos')
export class CreditsController {
    constructor(private readonly creditsService: CreditsService) {}

    @Post('aprobar')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.VENDEDOR, RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    aprobarCredito(@Body() dto: AprobarCreditoDto, @CurrentUser() user: any) {
        const actorId = user?.userId || user?.id;
        return this.creditsService.approve(
            dto,
            actorId,
            OrigenCredito.VENDEDOR,
            'Credito aprobado',
            'CreditoAprobado',
        );
    }

    @Post('aprobar-excepcion')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.SUPERVISOR, RolUsuario.ADMIN)
    aprobarCreditoExcepcion(@Body() dto: AprobarCreditoDto, @CurrentUser() user: any) {
        const actorId = user?.userId || user?.id;
        return this.creditsService.approve(
            dto,
            actorId,
            OrigenCredito.EXCEPCION,
            'Credito excepcional aprobado',
            'CreditoExcepcionalAprobado',
        );
    }

    @Post('procesar-vencidos')
    @UseGuards(ServiceTokenGuard)
    procesarVencidos() {
        return this.creditsService.processOverdues('sistema');
    }

    @Put(':id/cancelar')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    cancelar(@Param('id') id: string, @Body('motivo') motivo: string, @CurrentUser() user: any) {
        const actorId = user?.userId || user?.id;
        return this.creditsService.cancel(id, actorId, motivo);
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR, RolUsuario.VENDEDOR)
    listar(
        @Query('cliente_id') clienteId?: string,
        @Query('vendedor_id') vendedorId?: string,
        @Query('estado') estado?: string,
    ) {
        if (clienteId) {
            return this.creditsService.findByClient(clienteId, estado as EstadoCredito);
        }
        if (vendedorId) {
            const estados = estado ? estado.split(',').map((item) => item.trim() as EstadoCredito) : undefined;
            return this.creditsService.findBySeller(vendedorId, estados);
        }
        return this.creditsService.findAll();
    }

    @Get('proximos-vencer')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    proximosVencer(@Query('dias') dias?: string) {
        const parsed = dias ? Number(dias) : 7;
        return this.creditsService.listUpcomingDue(parsed);
    }

    @Get('reporte-vencidos')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    reporteVencidos() {
        return this.creditsService.listOverdueReport();
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    detalle(@Param('id') id: string) {
        return this.creditsService.getCreditDetail(id);
    }

    @Get(':id/pagos')
    @UseGuards(JwtAuthGuard)
    pagos(@Param('id') id: string) {
        return this.creditsService.listPayments(id);
    }
}

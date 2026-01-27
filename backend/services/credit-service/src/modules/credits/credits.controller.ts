import { Body, Controller, Get, Post, Put, Param, Query, UseGuards, ForbiddenException } from '@nestjs/common';
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

    @Get('internal/pedido/:pedidoId')
    @UseGuards(ServiceTokenGuard)
    getByPedidoInternal(@Param('pedidoId') pedidoId: string) {
        return this.creditsService.getCreditByOrderInternal(pedidoId);
    }

    @Put(':id/cancelar')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    cancelar(@Param('id') id: string, @Body('motivo') motivo: string, @CurrentUser() user: any) {
        const actorId = user?.userId || user?.id;
        return this.creditsService.cancel(id, actorId, motivo);
    }

    @Put(':id/rechazar')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.VENDEDOR, RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    rechazar(@Param('id') id: string, @Body('motivo') motivo: string, @CurrentUser() user: any) {
        const actorId = user?.userId || user?.id;
        return this.creditsService.cancel(id, actorId, motivo || 'Credito rechazado');
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR, RolUsuario.VENDEDOR, RolUsuario.CLIENTE)
    async listar(
        @Query('cliente_id') clienteId?: string,
        @Query('vendedor_id') vendedorId?: string,
        @Query('estado') estado?: string,
        @Query('pedido_id') pedidoId?: string,
        @CurrentUser() user?: any,
    ) {
        if (pedidoId) {
            const credit = await this.creditsService.getCreditDetailByOrder(pedidoId);
            const isClient = user?.role === RolUsuario.CLIENTE;
            const userId = user?.userId || user?.id;
            if (isClient && credit?.credito?.cliente_id !== userId) {
                throw new ForbiddenException('No tienes permisos para ver este credito');
            }
            return credit;
        }
        if (user?.role === RolUsuario.CLIENTE) {
            const userId = user?.userId || user?.id;
            if (!clienteId || clienteId !== userId) {
                throw new ForbiddenException('No tienes permisos para ver estos creditos');
            }
        }
        if (clienteId) {
            return this.creditsService.findByClient(clienteId, estado as EstadoCredito);
        }
        if (vendedorId) {
            const estados = estado ? estado.split(',').map((item) => item.trim() as EstadoCredito) : undefined;
            return this.creditsService.findBySeller(vendedorId, estados);
        }
        return this.creditsService.findAll();
    }

    @Get('mis')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.CLIENTE)
    listarMisCreditos(@CurrentUser() user: any, @Query('estado') estado?: string) {
        const clienteId = user?.userId || user?.id;
        if (!clienteId) {
            throw new ForbiddenException('Cliente no identificado');
        }
        if (estado && estado.includes(',')) {
            const estados = estado.split(',').map((item) => item.trim() as EstadoCredito);
            return this.creditsService.findByClientStates(clienteId, estados);
        }
        return this.creditsService.findByClient(clienteId, estado as EstadoCredito);
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
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR, RolUsuario.VENDEDOR, RolUsuario.CLIENTE)
    async detalle(@Param('id') id: string, @CurrentUser() user: any) {
        const credit = await this.creditsService.getCreditDetail(id);
        const isClient = user?.role === RolUsuario.CLIENTE;
        const userId = user?.userId || user?.id;
        if (isClient && credit?.credito?.cliente_id !== userId) {
            throw new ForbiddenException('No tienes permisos para ver este credito');
        }
        return credit;
    }

    @Get(':id/pagos')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR, RolUsuario.VENDEDOR, RolUsuario.CLIENTE)
    async pagos(@Param('id') id: string, @CurrentUser() user: any) {
        const credit = await this.creditsService.findOne(id);
        const isClient = user?.role === RolUsuario.CLIENTE;
        const userId = user?.userId || user?.id;
        if (isClient && credit.cliente_id !== userId) {
            throw new ForbiddenException('No tienes permisos para ver este credito');
        }
        return credit.pagos || [];
    }
}

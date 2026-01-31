import {
    Body,
    Controller,
    Get,
    Post,
    Put,
    Param,
    Query,
    UseGuards,
    ForbiddenException,
    ParseUUIDPipe,
    ParseIntPipe,
    DefaultValuePipe,
    HttpCode,
    HttpStatus,
    Header,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiQuery,
    ApiParam,
} from '@nestjs/swagger';
import { CreditsService } from './credits.service';
import { AprobarCreditoDto } from './dto/aprobar-credito.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ServiceTokenGuard } from '../../common/guards/service-token.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { RolUsuario } from '../../common/constants/rol-usuario.enum';
import { OrigenCredito } from '../../common/constants/credit-origin.enum';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { CreditFilterDto } from './dto/credit-filter.dto';
import { createPaginatedResponse } from '../../common/interfaces/paginated-response.interface';

@ApiTags('credits')
@Controller({ path: 'credits', version: '1' })
export class CreditsController {
    constructor(private readonly creditsService: CreditsService) { }

    @Post('approve')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.VENDEDOR, RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    @ApiOperation({ summary: 'Aprobar crédito' })
    @HttpCode(HttpStatus.OK)
    aprobarCredito(@Body() dto: AprobarCreditoDto, @CurrentUser() user: AuthUser) {
        const actorId = user?.userId || user?.id;
        return this.creditsService.approve(
            dto,
            actorId,
            OrigenCredito.VENDEDOR,
            'Credito aprobado',
            'CreditoAprobado',
        );
    }

    @Post('approve/exception')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.SUPERVISOR, RolUsuario.ADMIN)
    @ApiOperation({ summary: 'Aprobar crédito por excepción' })
    @HttpCode(HttpStatus.OK)
    aprobarCreditoExcepcion(@Body() dto: AprobarCreditoDto, @CurrentUser() user: AuthUser) {
        const actorId = user?.userId || user?.id;
        return this.creditsService.approve(
            dto,
            actorId,
            OrigenCredito.EXCEPCION,
            'Credito excepcional aprobado',
            'CreditoExcepcionalAprobado',
        );
    }

    @Post('process-overdue')
    @UseGuards(ServiceTokenGuard)
    @ApiOperation({ summary: 'Procesar créditos vencidos (Sistema)' })
    @HttpCode(HttpStatus.OK)
    procesarVencidos() {
        return this.creditsService.processOverdues('sistema');
    }

    @Get('internal/order/:orderId')
    @UseGuards(ServiceTokenGuard)
    @ApiOperation({ summary: 'Obtener crédito por pedido (Interno)' })
    getByPedidoInternal(@Param('orderId', ParseUUIDPipe) pedidoId: string) {
        return this.creditsService.getCreditByOrderInternal(pedidoId);
    }

    @Put(':id/cancel')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    @ApiOperation({ summary: 'Cancelar crédito' })
    @HttpCode(HttpStatus.OK)
    cancelar(
        @Param('id', ParseUUIDPipe) id: string,
        @Body('motivo') motivo: string,
        @CurrentUser() user: AuthUser,
    ) {
        const actorId = user?.userId || user?.id;
        return this.creditsService.cancel(id, actorId, motivo);
    }

    @Put(':id/reject')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.VENDEDOR, RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    @ApiOperation({ summary: 'Rechazar crédito' })
    @HttpCode(HttpStatus.OK)
    rechazar(
        @Param('id', ParseUUIDPipe) id: string,
        @Body('motivo') motivo: string,
        @CurrentUser() user: AuthUser,
    ) {
        const actorId = user?.userId || user?.id;
        return this.creditsService.cancel(id, actorId, motivo || 'Credito rechazado');
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR, RolUsuario.VENDEDOR, RolUsuario.CLIENTE)
    @ApiOperation({ summary: 'Listar créditos con paginación y filtros' })
    @Header('Cache-Control', 'no-store')
    async listar(
        @Query() pagination: PaginationQueryDto,
        @Query() filters: CreditFilterDto,
        @CurrentUser() user: AuthUser,
    ) {
        const paginatedFilters = { ...filters };

        if (user?.role === RolUsuario.CLIENTE) {
            paginatedFilters.customerId = user.userId || user.id;
        }

        const response = await this.creditsService.findAllPaginated(
            pagination,
            paginatedFilters,
        );

        // Response is already formatted by service
        return response;
    }

    @Get('me')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.CLIENTE)
    @ApiOperation({ summary: 'Listar mis créditos' })
    listarMisCreditos(
        @CurrentUser() user: AuthUser,
        @Query() pagination: PaginationQueryDto,
        @Query() filters: CreditFilterDto
    ) {
        const clienteId = user?.userId || user?.id;
        if (!clienteId) {
            throw new ForbiddenException('Cliente no identificado');
        }
        filters.customerId = clienteId;
        return this.creditsService.findAllPaginated(pagination, filters); // Reuse paginated logic
    }

    @Get('upcoming-due')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    @ApiOperation({ summary: 'Listar próximos a vencer' })
    proximosVencer(
        @Query('days', new DefaultValuePipe(7), ParseIntPipe) dias: number,
    ) {
        return this.creditsService.listUpcomingDue(dias);
    }

    @Get('overdue-report')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    @ApiOperation({ summary: 'Reporte de vencidos' })
    reporteVencidos() {
        return this.creditsService.listOverdueReport();
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR, RolUsuario.VENDEDOR, RolUsuario.CLIENTE)
    @ApiOperation({ summary: 'Obtener detalle de crédito' })
    async detalle(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
        const credit = await this.creditsService.getCreditDetail(id);
        const isClient = user?.role === RolUsuario.CLIENTE;
        const userId = user?.userId || user?.id;
        if (isClient && credit?.credito?.cliente_id !== userId) {
            throw new ForbiddenException('No tienes permisos para ver este credito');
        }
        return credit;
    }

    @Get(':id/payments')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR, RolUsuario.VENDEDOR, RolUsuario.CLIENTE)
    @ApiOperation({ summary: 'Listar pagos de un crédito' })
    async pagos(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
        const credit = await this.creditsService.findOne(id);
        const isClient = user?.role === RolUsuario.CLIENTE;
        const userId = user?.userId || user?.id;
        if (isClient && credit.cliente_id !== userId) {
            throw new ForbiddenException('No tienes permisos para ver este credito');
        }
        return credit.pagos || [];
    }
}

import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { RegisterPaymentDto } from './dto/register-payment.dto';
import { RegistrarPagoDto } from './dto/registrar-pago.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolUsuario } from '../../common/constants/rol-usuario.enum';

@Controller('creditos')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) {}

    @Post(':id/pagos')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.VENDEDOR, RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    registerPayment(
        @Param('id') aprobacionCreditoId: string,
        @Body() body: RegistrarPagoDto,
        @CurrentUser() user: any,
    ) {
        const actorId = user?.userId || user?.id;
        const dto: RegisterPaymentDto = {
            aprobacion_credito_id: aprobacionCreditoId,
            monto_pago: body.monto_pago,
            moneda: body.moneda,
            fecha_pago: body.fecha_pago,
            registrado_por_id: actorId,
            metodo_registro: body.metodo_registro,
            referencia: body.referencia,
            notas: body.notas,
        };
        return this.paymentsService.registerPayment(dto, actorId);
    }

    @Get(':id/pagos')
    @UseGuards(JwtAuthGuard)
    findByCredit(@Param('id') aprobacionCreditoId: string) {
        return this.paymentsService.findByCredit(aprobacionCreditoId);
    }

    @Get(':id/pagos/balance')
    @UseGuards(JwtAuthGuard)
    getBalance(@Param('id') aprobacionCreditoId: string) {
        return this.paymentsService.calculateBalance(aprobacionCreditoId);
    }
}

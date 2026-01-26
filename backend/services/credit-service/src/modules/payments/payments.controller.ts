import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { RegisterPaymentDto } from './dto/register-payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolUsuario } from '../../common/constants/rol-usuario.enum';

@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.VENDEDOR, RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    registerPayment(@Body() dto: RegisterPaymentDto) {
        return this.paymentsService.registerPayment(dto);
    }

    @Get('credit/:aprobacionCreditoId')
    @UseGuards(JwtAuthGuard)
    findByCredit(@Param('aprobacionCreditoId') aprobacionCreditoId: string) {
        return this.paymentsService.findByCredit(aprobacionCreditoId);
    }

    @Get('credit/:aprobacionCreditoId/balance')
    @UseGuards(JwtAuthGuard)
    getBalance(@Param('aprobacionCreditoId') aprobacionCreditoId: string) {
        return this.paymentsService.calculateBalance(aprobacionCreditoId);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    findOne(@Param('id') id: string) {
        return this.paymentsService.findOne(id);
    }
}

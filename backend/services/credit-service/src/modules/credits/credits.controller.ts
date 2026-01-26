import { Controller, Get, Post, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { CreditsService } from './credits.service';
import { CreateCreditDto } from './dto/create-credit.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolUsuario } from '../../common/constants/rol-usuario.enum';
import { EstadoCredito } from '../../common/constants/credit-status.enum';

@Controller('credits')
export class CreditsController {
    constructor(private readonly creditsService: CreditsService) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.VENDEDOR, RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    create(@Body() dto: CreateCreditDto) {
        return this.creditsService.create(dto);
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    findAll() {
        return this.creditsService.findAll();
    }

    @Get('client/:clienteId')
    @UseGuards(JwtAuthGuard)
    findByClient(@Param('clienteId') clienteId: string) {
        return this.creditsService.findByClient(clienteId);
    }

    @Get('seller/:vendedorId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.VENDEDOR, RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    findBySeller(@Param('vendedorId') vendedorId: string) {
        return this.creditsService.findBySeller(vendedorId);
    }

    @Get('order/:pedidoId')
    @UseGuards(JwtAuthGuard)
    findByOrder(@Param('pedidoId') pedidoId: string) {
        return this.creditsService.findByOrder(pedidoId);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    findOne(@Param('id') id: string) {
        return this.creditsService.findOne(id);
    }

    @Patch(':id/status')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    updateStatus(@Param('id') id: string, @Body('estado') estado: EstadoCredito) {
        return this.creditsService.updateStatus(id, estado);
    }

    @Patch(':id/cancel')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    cancel(@Param('id') id: string) {
        return this.creditsService.cancel(id);
    }
}

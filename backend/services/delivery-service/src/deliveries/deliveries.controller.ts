import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Patch,
    Delete,
    UseGuards,
    Query,
} from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolUsuario } from '../common/constants/rol-usuario.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('deliveries')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeliveriesController {
    constructor(private readonly deliveriesService: DeliveriesService) { }

    @Post()
    @Roles(RolUsuario.ADMIN, RolUsuario.ADMINISTRADOR_LOGISTICA)
    create(@Body() createDeliveryDto: CreateDeliveryDto) {
        return this.deliveriesService.create(createDeliveryDto);
    }

    @Get()
    @Roles(RolUsuario.ADMIN, RolUsuario.ADMINISTRADOR_LOGISTICA, RolUsuario.CONDUCTOR)
    findAll() {
        return this.deliveriesService.findAll();
    }

    @Get('by-order/:pedidoId')
    @Roles(RolUsuario.ADMIN, RolUsuario.ADMINISTRADOR_LOGISTICA)
    findByOrder(@Param('pedidoId') pedidoId: string) {
        return this.deliveriesService.findByOrder(pedidoId);
    }

    @Get('by-route/:rutaLogisticaId')
    @Roles(RolUsuario.ADMIN, RolUsuario.ADMINISTRADOR_LOGISTICA, RolUsuario.CONDUCTOR)
    findByRoute(@Param('rutaLogisticaId') rutaLogisticaId: string) {
        return this.deliveriesService.findByRoute(rutaLogisticaId);
    }

    @Get('by-driver/:conductorId')
    @Roles(RolUsuario.ADMIN, RolUsuario.ADMINISTRADOR_LOGISTICA, RolUsuario.CONDUCTOR)
    findByDriver(@Param('conductorId') conductorId: string) {
        return this.deliveriesService.findByDriver(conductorId);
    }

    @Get(':id')
    @Roles(RolUsuario.ADMIN, RolUsuario.ADMINISTRADOR_LOGISTICA, RolUsuario.CONDUCTOR)
    findOne(@Param('id') id: string) {
        return this.deliveriesService.findOne(id);
    }

    @Patch(':id/status')
    @Roles(RolUsuario.ADMIN, RolUsuario.ADMINISTRADOR_LOGISTICA, RolUsuario.CONDUCTOR)
    updateStatus(
        @Param('id') id: string,
        @Body() updateStatusDto: UpdateDeliveryStatusDto,
        @CurrentUser() user?: any,
    ) {
        return this.deliveriesService.updateStatus(id, updateStatusDto, user?.id);
    }

    @Patch(':id/assign-route')
    @Roles(RolUsuario.ADMIN, RolUsuario.ADMINISTRADOR_LOGISTICA)
    assignToRoute(
        @Param('id') id: string,
        @Body('rutaLogisticaId') rutaLogisticaId: string,
    ) {
        return this.deliveriesService.assignToRoute(id, rutaLogisticaId);
    }

    @Delete(':id')
    @Roles(RolUsuario.ADMIN)
    remove(@Param('id') id: string) {
        return this.deliveriesService.remove(id);
    }
}

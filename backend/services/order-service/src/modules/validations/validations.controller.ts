import { Controller, Get, Post, Body, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ValidationsService } from './validations.service';
import { CreateValidacionDto } from './dto/create-validacion.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolUsuario } from '../../common/constants/rol-usuario.enum';

@Controller('validations')
export class ValidationsController {
    constructor(private readonly validationsService: ValidationsService) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.BODEGUERO, RolUsuario.ADMIN)
    create(@Body() dto: CreateValidacionDto) {
        return this.validationsService.create(dto);
    }

    @Get('order/:pedidoId')
    @UseGuards(JwtAuthGuard)
    findByOrder(@Param('pedidoId', ParseUUIDPipe) pedidoId: string) {
        return this.validationsService.findByOrder(pedidoId);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.validationsService.findOne(id);
    }
}

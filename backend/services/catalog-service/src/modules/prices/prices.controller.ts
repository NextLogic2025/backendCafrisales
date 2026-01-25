import { Controller, Post, Body, Get, Param, UseGuards, Patch, Delete } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolUsuario } from '../../common/enums/rol-usuario.enum';
import { PricesService } from './prices.service';

@Controller('prices')
export class PricesController {
  constructor(private readonly svc: PricesService) {}

  @Get(':skuId')
  get(@Param('skuId') skuId: string) {
    return this.svc.getCurrentPrice(skuId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF, RolUsuario.SUPERVISOR)
  update(@Body() dto: { sku_id: string; precio: number }) {
    return this.svc.updatePrice(dto);
  }

  @Get()
  list() {
    return this.svc.findAll();
  }

  @Get('by-id/:id')
  getById(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF, RolUsuario.SUPERVISOR)
  patch(@Param('id') id: string, @Body() dto: Partial<{ precio: number }>) {
    return this.svc.updateById(id, dto as any);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF)
  remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }
}

import { Controller, Post, Body, Get, Param, UseGuards, Put } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolUsuario } from '../../common/enums/rol-usuario.enum';
import { GetUser, AuthUser } from '../../common/decorators/get-user.decorator';
import { PricesService } from './prices.service';
import { CreateSkuPriceDto } from './dto/create-sku-price.dto';
import { UpdateSkuPriceDto } from './dto/update-price.dto';

@Controller('skus')
export class PricesController {
  constructor(private readonly svc: PricesService) {}

  @Get(':skuId/precio-vigente')
  getCurrent(@Param('skuId') skuId: string) {
    return this.svc.getCurrentPrice(skuId);
  }

  @Get(':skuId/precios-historial')
  getHistory(@Param('skuId') skuId: string) {
    return this.svc.getHistory(skuId);
  }

  @Post('precios-vigentes')
  getBatch(@Body() body: { sku_ids: string[] }) {
    return this.svc.getBatchCurrentPrices(body.sku_ids || []);
  }

  @Post(':skuId/precio')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF, RolUsuario.SUPERVISOR)
  create(
    @Param('skuId') skuId: string,
    @Body() dto: CreateSkuPriceDto,
    @GetUser() user?: AuthUser,
  ) {
    return this.svc.createInitialPrice(skuId, dto, user?.userId);
  }

  @Put(':skuId/precio')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF, RolUsuario.SUPERVISOR)
  update(
    @Param('skuId') skuId: string,
    @Body() dto: UpdateSkuPriceDto,
    @GetUser() user?: AuthUser,
  ) {
    return this.svc.updatePrice(skuId, dto.nuevo_precio, user?.userId);
  }
}
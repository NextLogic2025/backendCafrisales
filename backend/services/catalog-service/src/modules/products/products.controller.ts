import { Controller, Post, Body, Get, UseGuards, Param, Patch, Delete, ParseUUIDPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolUsuario } from '../../common/enums/rol-usuario.enum';
import { GetUser, AuthUser } from '../../common/decorators/get-user.decorator';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateCompleteProductDto } from './dto/create-complete-product.dto';
import { SkusService } from '../skus/skus.service';

@Controller('productos')
export class ProductsController {
  constructor(
    private readonly svc: ProductsService,
    private readonly skusService: SkusService,
  ) {}

  /**
   * POST /productos/complete
   * Creates a complete sellable product (Category -> Product -> SKU -> Price)
   * in a single atomic transaction.
   */
  @Post('complete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF, RolUsuario.SUPERVISOR)
  createComplete(@Body() dto: CreateCompleteProductDto, @GetUser() user: AuthUser) {
    return this.svc.createComplete(dto, user.userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF, RolUsuario.SUPERVISOR)
  create(@Body() dto: CreateProductDto, @GetUser() user: AuthUser) {
    return this.svc.create(dto as any, user.userId);
  }

  @Get()
  list() {
    return this.svc.findAll();
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.findOne(id);
  }

  @Get(':id/skus')
  listSkus(@Param('id', ParseUUIDPipe) id: string) {
    return this.skusService.findByProduct(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF, RolUsuario.SUPERVISOR)
  patch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateProductDto>,
    @GetUser() user: AuthUser,
  ) {
    return this.svc.update(id, dto as any, user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF)
  remove(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: AuthUser) {
    return this.svc.deactivate(id, user.userId);
  }
}
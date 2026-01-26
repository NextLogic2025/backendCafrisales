import { Controller, Post, Body, Get, UseGuards, Param, Patch, Delete } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolUsuario } from '../../common/enums/rol-usuario.enum';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { GetUser, AuthUser } from '../../common/decorators/get-user.decorator';
import { ProductsService } from '../products/products.service';

@Controller('categorias')
export class CategoriesController {
  constructor(
    private readonly svc: CategoriesService,
    private readonly productsService: ProductsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF, RolUsuario.SUPERVISOR)
  create(@Body() dto: CreateCategoryDto, @GetUser() user?: AuthUser) {
    return this.svc.create(dto as any, user?.userId);
  }

  @Get()
  list() {
    return this.svc.findAll();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Get(':id/productos')
  listProducts(@Param('id') id: string) {
    return this.productsService.findByCategory(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF, RolUsuario.SUPERVISOR)
  patch(
    @Param('id') id: string,
    @Body() dto: Partial<CreateCategoryDto>,
    @GetUser() user?: AuthUser,
  ) {
    return this.svc.update(id, dto as any, user?.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF)
  remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }
}

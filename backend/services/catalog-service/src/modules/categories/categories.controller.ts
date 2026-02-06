import { Controller, Post, Body, Get, UseGuards, Param, Patch, Delete, ParseUUIDPipe, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolUsuario } from '../../common/enums/rol-usuario.enum';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { GetUser, AuthUser } from '../../common/decorators/get-user.decorator';
import { ProductsService } from '../products/products.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('categorias')
@Controller('categorias')
export class CategoriesController {
  constructor(
    private readonly svc: CategoriesService,
    private readonly productsService: ProductsService,
  ) { }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF, RolUsuario.SUPERVISOR)
  create(@Body() dto: CreateCategoryDto, @GetUser() user: AuthUser) {
    return this.svc.create(dto as any, user.userId);
  }

  @Post(':id/imagen')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF, RolUsuario.SUPERVISOR)
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: AuthUser,
  ) {
    return this.svc.uploadImage(id, file, user.userId);
  }

  @Get()
  list() {
    return this.svc.findAll();
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.findOne(id);
  }

  @Get(':id/productos')
  listProducts(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findByCategory(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF, RolUsuario.SUPERVISOR)
  patch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateCategoryDto>,
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

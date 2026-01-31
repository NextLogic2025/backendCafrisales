import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
  Header,
  Res,
  Patch,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolUsuario } from '../../common/enums/rol-usuario.enum';
import { GetUser, AuthUser } from '../../common/decorators/get-user.decorator';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateCompleteProductDto } from './dto/create-complete-product.dto';
import { SkusService } from '../skus/skus.service';
import { ProductFilterDto } from './dto/product-filter.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { createPaginatedResponse } from '../../common/interfaces/paginated-response.interface';

@ApiTags('products')
@Controller({ path: 'products', version: '1' })
export class ProductsController {
  constructor(
    private readonly svc: ProductsService,
    private readonly skusService: SkusService,
  ) { }

  @Post('complete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF, RolUsuario.SUPERVISOR)
  @ApiOperation({ summary: 'Crear producto completo (Product -> SKU -> Price)' })
  async createComplete(@Body() dto: CreateCompleteProductDto, @GetUser() user: AuthUser) {
    return this.svc.createComplete(dto, user.userId);
  }

  @Get()
  @Header('Cache-Control', 'public, max-age=300')
  @ApiOperation({ summary: 'Listar productos con paginación y filtros' })
  async findAll(
    @Query() pagination: PaginationQueryDto,
    @Query() filters: ProductFilterDto,
  ) {
    const { data, total } = await this.svc.findAllPaginated(
      pagination,
      filters,
    );

    return createPaginatedResponse(data, total, pagination.page, pagination.limit);
  }

  @Get('search/autocomplete')
  @Header('Cache-Control', 'public, max-age=60')
  @ApiOperation({ summary: 'Autocompletado de búsqueda de productos' })
  @ApiQuery({ name: 'q', description: 'Término de búsqueda', required: true })
  async autocomplete(@Query('q') query: string) {
    return this.svc.autocomplete(query);
  }

  @Get(':id')
  @Header('Cache-Control', 'public, max-age=600')
  @ApiOperation({ summary: 'Obtener producto por ID' })
  @ApiResponse({ status: 200, description: 'Producto encontrado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.findOne(id);
  }

  @Get(':id/skus')
  @ApiOperation({ summary: 'Listar SKUs de un producto' })
  async listSkus(@Param('id', ParseUUIDPipe) id: string) {
    return this.skusService.findByProduct(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF, RolUsuario.SUPERVISOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear nuevo producto' })
  async create(
    @Body() dto: CreateProductDto,
    @GetUser() user: AuthUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const product = await this.svc.create(dto as any, user.userId);
    res.setHeader('Location', `/api/v1/products/${product.id}`);
    return product;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF, RolUsuario.SUPERVISOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar producto' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateProductDto>,
    @GetUser() user: AuthUser,
  ) {
    return this.svc.update(id, dto as any, user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desactivar producto' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: AuthUser) {
    await this.svc.deactivate(id, user.userId);
  }
}
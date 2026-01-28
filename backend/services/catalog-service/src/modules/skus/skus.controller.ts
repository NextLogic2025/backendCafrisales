import { Controller, Post, Body, Get, UseGuards, Param, Patch, Delete, Put, Query, ParseUUIDPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolUsuario } from '../../common/enums/rol-usuario.enum';
import { GetUser, AuthUser } from '../../common/decorators/get-user.decorator';
import { SkusService } from './skus.service';
import { CreateSkuDto } from './dto/create-sku.dto';

@Controller('skus')
export class SkusController {
  constructor(private readonly svc: SkusService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF, RolUsuario.SUPERVISOR)
  create(@Body() dto: CreateSkuDto, @GetUser() user: AuthUser) {
    return this.svc.create(dto as any, user.userId);
  }

  @Get()
  list() {
    return this.svc.findAll();
  }

  @Get('complete')
  listComplete() {
    return this.svc.findAllComplete();
  }

  @Get('buscar')
  search(@Query('q') query: string) {
    return this.svc.search(query || '');
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF, RolUsuario.SUPERVISOR)
  patch(@Param('id', ParseUUIDPipe) id: string, @Body() dto: Partial<CreateSkuDto>) {
    return this.svc.update(id, dto as any);
  }

  @Put(':id/desactivar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF, RolUsuario.SUPERVISOR)
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.deactivate(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.deactivate(id);
  }
}
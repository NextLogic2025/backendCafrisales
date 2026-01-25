import { Controller, Post, Body, Get, UseGuards, Param, Patch, Delete } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolUsuario } from '../../common/enums/rol-usuario.enum';
import { SkusService } from './skus.service';
import { CreateSkuDto } from './dto/create-sku.dto';

@Controller('skus')
export class SkusController {
  constructor(private readonly svc: SkusService) { }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF, RolUsuario.SUPERVISOR)
  create(@Body() dto: CreateSkuDto) {
    return this.svc.create(dto as any);
  }

  @Get()
  list() {
    return this.svc.findAll();
  }

  @Get('complete')
  listComplete() {
    return this.svc.findAllComplete();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF, RolUsuario.SUPERVISOR)
  patch(@Param('id') id: string, @Body() dto: Partial<CreateSkuDto>) {
    return this.svc.update(id, dto as any);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF)
  remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }
}

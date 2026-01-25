import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RolUsuario } from '../../common/enums/rol-usuario.enum';

@Controller('v1/usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  @Roles(
    RolUsuario.ADMIN,
    RolUsuario.STAFF,
    RolUsuario.SUPERVISOR,
    RolUsuario.VENDEDOR,
    RolUsuario.BODEGUERO,
    RolUsuario.CLIENTE,
  )
  async get(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  async patch(@Param('id') id: string, @Body() body: any) {
    return this.usersService.update(id, body);
  }
}

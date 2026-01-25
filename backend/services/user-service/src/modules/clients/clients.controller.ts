import { Body, Controller, Get, Param, Patch, Post, Put, NotFoundException, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cliente } from './entities/cliente.entity';
import { Repository } from 'typeorm';
import { CreateClientDto } from './dto/create-client.dto';
import { CondicionesComercialesCliente } from './entities/condiciones.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RolUsuario } from '../../common/enums/rol-usuario.enum';

@Controller('clientes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientsController {
  constructor(
    @InjectRepository(Cliente)
    private readonly clienteRepo: Repository<Cliente>,
    @InjectRepository(CondicionesComercialesCliente)
    private readonly condicionesRepo: Repository<CondicionesComercialesCliente>,
  ) {}

  @Post()
  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF)
  async create(@Body() dto: CreateClientDto) {
    const entity = this.clienteRepo.create(dto as any);
    return this.clienteRepo.save(entity);
  }

  @Roles(RolUsuario.SUPERVISOR, RolUsuario.VENDEDOR, RolUsuario.BODEGUERO, RolUsuario.ADMIN, RolUsuario.STAFF)
  @Get(':usuarioId')
  async get(@Param('usuarioId') usuarioId: string) {
    const c = await this.clienteRepo.findOneBy({ usuario_id: usuarioId } as any);
    if (!c) throw new NotFoundException();
    return c;
  }

  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF, RolUsuario.SUPERVISOR)
  @Patch(':usuarioId')
  async patch(@Param('usuarioId') usuarioId: string, @Body() body: Partial<Cliente>) {
    await this.clienteRepo.update({ usuario_id: usuarioId } as any, body as any);
    return this.clienteRepo.findOneBy({ usuario_id: usuarioId } as any);
  }

  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF, RolUsuario.SUPERVISOR)
  @Put(':usuarioId/condiciones-comerciales')
  async upsertCondiciones(@Param('usuarioId') usuarioId: string, @Body() body: Partial<CondicionesComercialesCliente>) {
    const exists = await this.condicionesRepo.findOneBy({ cliente_id: usuarioId } as any);
    if (exists) {
      await this.condicionesRepo.update({ cliente_id: usuarioId } as any, body as any);
      return this.condicionesRepo.findOneBy({ cliente_id: usuarioId } as any);
    }
    const entity = this.condicionesRepo.create({ cliente_id: usuarioId, ...body } as any);
    return this.condicionesRepo.save(entity);
  }
}

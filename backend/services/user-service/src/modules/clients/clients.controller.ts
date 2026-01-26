import { Body, Controller, Get, Param, Patch, Post, Put, NotFoundException, UseGuards, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cliente } from './entities/cliente.entity';
import { Repository } from 'typeorm';
import { CreateClientDto } from './dto/create-client.dto';
import { CondicionesComercialesCliente } from './entities/condiciones.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RolUsuario } from '../../common/enums/rol-usuario.enum';
import { Usuario } from '../users/entities/usuario.entity';
import { Perfil } from '../profiles/entities/perfil.entity';
import { CanalComercial } from '../channels/entities/canal-comercial.entity';

@Controller('clientes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientsController {
  constructor(
    @InjectRepository(Cliente)
    private readonly clienteRepo: Repository<Cliente>,
    @InjectRepository(CondicionesComercialesCliente)
    private readonly condicionesRepo: Repository<CondicionesComercialesCliente>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(Perfil)
    private readonly perfilRepo: Repository<Perfil>,
    @InjectRepository(CanalComercial)
    private readonly canalRepo: Repository<CanalComercial>,
  ) {}

  @Get()
  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF, RolUsuario.SUPERVISOR)
  async list(@Query('estado') estado?: string) {
    const normalized = (estado || 'activo').toLowerCase();
    const qb = this.clienteRepo
      .createQueryBuilder('c')
      .leftJoin(Usuario, 'u', 'u.id = c.usuario_id')
      .leftJoin(Perfil, 'p', 'p.usuario_id = c.usuario_id')
      .leftJoin(CanalComercial, 'canal', 'canal.id = c.canal_id')
      .select([
        'c.usuario_id as usuario_id',
        'c.canal_id as canal_id',
        'c.nombre_comercial as nombre_comercial',
        'c.ruc as ruc',
        'c.zona_id as zona_id',
        'c.direccion as direccion',
        'c.latitud as latitud',
        'c.longitud as longitud',
        'c.vendedor_asignado_id as vendedor_asignado_id',
        'c.creado_en as creado_en',
        'c.creado_por as creado_por',
        'u.email as email',
        'u.estado as estado',
        'p.nombres as nombres',
        'p.apellidos as apellidos',
        'p.telefono as telefono',
        'canal.nombre as canal_nombre',
        'canal.codigo as canal_codigo',
      ]);

    if (normalized !== 'todos' && normalized !== 'all') {
      const estadoValue = normalized === 'inactivo' ? 'inactivo' : 'activo';
      qb.where('u.estado = :estado', { estado: estadoValue });
    }

    return qb.getRawMany();
  }

  @Post()
  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF)
  async create(@Body() dto: CreateClientDto) {
    const entity = this.clienteRepo.create(dto as any);
    return this.clienteRepo.save(entity);
  }

  @Roles(RolUsuario.SUPERVISOR, RolUsuario.VENDEDOR, RolUsuario.BODEGUERO, RolUsuario.ADMIN, RolUsuario.STAFF)
  @Get(':usuarioId')
  async get(@Param('usuarioId') usuarioId: string) {
    const cliente = await this.clienteRepo.findOneBy({ usuario_id: usuarioId } as any);
    if (!cliente) throw new NotFoundException();

    const [usuario, perfil, canal] = await Promise.all([
      this.usuarioRepo.findOneBy({ id: usuarioId } as any),
      this.perfilRepo.findOneBy({ usuario_id: usuarioId } as any),
      this.canalRepo.findOneBy({ id: cliente.canal_id } as any),
    ]);

    return {
      ...cliente,
      email: usuario?.email,
      estado: usuario?.estado,
      nombres: perfil?.nombres,
      apellidos: perfil?.apellidos,
      telefono: perfil?.telefono,
      canal_nombre: canal?.nombre,
      canal_codigo: canal?.codigo,
    };
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

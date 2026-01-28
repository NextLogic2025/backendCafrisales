import { Body, Controller, Get, Param, Patch, Post, Put, NotFoundException, UseGuards, Query, BadRequestException, ParseUUIDPipe } from '@nestjs/common';
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
import { GetUser, AuthUser } from '../../common/decorators/get-user.decorator';
import { Vendedor } from '../staff/entities/vendedor.entity';
import { AssignVendedorDto } from './dto/assign-vendedor.dto';
import { OutboxService } from '../outbox/outbox.service';

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
    @InjectRepository(Vendedor)
    private readonly vendedorRepo: Repository<Vendedor>,
    private readonly outboxService: OutboxService,
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

  @Roles(RolUsuario.SUPERVISOR, RolUsuario.VENDEDOR, RolUsuario.BODEGUERO, RolUsuario.ADMIN, RolUsuario.STAFF, RolUsuario.TRANSPORTISTA)
  @Get(':usuarioId')
  async get(@Param('usuarioId', ParseUUIDPipe) usuarioId: string) {
    const cliente = await this.clienteRepo.findOneBy({ usuario_id: usuarioId } as any);
    if (!cliente) throw new NotFoundException('Cliente no encontrado');

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
  async patch(@Param('usuarioId', ParseUUIDPipe) usuarioId: string, @Body() body: Partial<Cliente>) {
    const exists = await this.clienteRepo.findOneBy({ usuario_id: usuarioId } as any);
    if (!exists) throw new NotFoundException('Cliente no encontrado');
    await this.clienteRepo.update({ usuario_id: usuarioId } as any, body as any);
    return this.clienteRepo.findOneBy({ usuario_id: usuarioId } as any);
  }

  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF, RolUsuario.SUPERVISOR)
  @Put(':usuarioId/condiciones-comerciales')
  async upsertCondiciones(
    @Param('usuarioId', ParseUUIDPipe) usuarioId: string,
    @Body() body: Partial<CondicionesComercialesCliente>,
    @GetUser() user: AuthUser,
  ) {
    const actorId = user.userId;
    const exists = await this.condicionesRepo.findOneBy({ cliente_id: usuarioId } as any);
    if (exists) {
      await this.condicionesRepo.update(
        { cliente_id: usuarioId } as any,
        {
          ...body,
          actualizado_por: actorId,
          actualizado_en: new Date(),
        } as any,
      );
      const updated = await this.condicionesRepo.findOneBy({ cliente_id: usuarioId } as any);
      await this.outboxService.createEvent({
        tipo: 'CondicionesActualizadas',
        claveAgregado: usuarioId,
        payload: { cliente_id: usuarioId },
      });
      return updated;
    }
    const entity = this.condicionesRepo.create({
      cliente_id: usuarioId,
      ...body,
      actualizado_por: actorId,
      actualizado_en: new Date(),
    } as any);
    const created = await this.condicionesRepo.save(entity);
    await this.outboxService.createEvent({
      tipo: 'CondicionesActualizadas',
      claveAgregado: usuarioId,
      payload: { cliente_id: usuarioId },
    });
    return created;
  }

  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF, RolUsuario.SUPERVISOR)
  @Put(':usuarioId/condiciones')
  async upsertCondicionesAlias(
    @Param('usuarioId', ParseUUIDPipe) usuarioId: string,
    @Body() body: Partial<CondicionesComercialesCliente>,
    @GetUser() user: AuthUser,
  ) {
    return this.upsertCondiciones(usuarioId, body, user);
  }

  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF, RolUsuario.SUPERVISOR)
  @Put(':usuarioId/asignar-vendedor')
  async assignVendedor(
    @Param('usuarioId', ParseUUIDPipe) usuarioId: string,
    @Body() body: AssignVendedorDto,
    @GetUser() user: AuthUser,
  ) {
    const vendedorId = body.vendedor_id;
    const vendedorUser = await this.usuarioRepo.findOneBy({ id: vendedorId } as any);
    if (!vendedorUser || vendedorUser.rol !== 'vendedor' || vendedorUser.estado !== 'activo') {
      throw new BadRequestException('Vendedor invalido o inactivo');
    }

    const vendedor = await this.vendedorRepo.findOneBy({ usuario_id: vendedorId } as any);
    if (!vendedor || vendedor.activo === false) {
      throw new BadRequestException('Vendedor no activo');
    }

    const cliente = await this.clienteRepo.findOneBy({ usuario_id: usuarioId } as any);
    if (!cliente) throw new NotFoundException('Cliente no encontrado');

    await this.clienteRepo.update(
      { usuario_id: usuarioId } as any,
      { vendedor_asignado_id: vendedorId } as any,
    );

    await this.outboxService.createEvent({
      tipo: 'VendedorAsignado',
      claveAgregado: usuarioId,
      payload: { cliente_id: usuarioId, vendedor_id: vendedorId, asignado_por: user.userId },
    });

    return { status: 'ok' };
  }

  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF, RolUsuario.SUPERVISOR, RolUsuario.VENDEDOR)
  @Get(':usuarioId/condiciones')
  async getCondiciones(@Param('usuarioId', ParseUUIDPipe) usuarioId: string) {
    const cliente = await this.clienteRepo.findOneBy({ usuario_id: usuarioId } as any);
    if (!cliente) throw new NotFoundException('Cliente no encontrado');

    const condiciones = await this.condicionesRepo.findOneBy({ cliente_id: usuarioId } as any);
    if (condiciones) {
      return condiciones;
    }

    return {
      cliente_id: usuarioId,
      permite_negociacion: false,
      porcentaje_descuento_max: 0,
      requiere_aprobacion_supervisor: false,
      observaciones: null,
    };
  }
}

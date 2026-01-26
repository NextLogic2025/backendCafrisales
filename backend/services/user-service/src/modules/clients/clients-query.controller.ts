import { Controller, Get, Param, UseGuards, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cliente } from './entities/cliente.entity';
import { Usuario } from '../users/entities/usuario.entity';
import { Perfil } from '../profiles/entities/perfil.entity';
import { CanalComercial } from '../channels/entities/canal-comercial.entity';
import { Vendedor } from '../staff/entities/vendedor.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolUsuario } from '../../common/enums/rol-usuario.enum';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientsQueryController {
  constructor(
    @InjectRepository(Cliente)
    private readonly clienteRepo: Repository<Cliente>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(Perfil)
    private readonly perfilRepo: Repository<Perfil>,
    @InjectRepository(CanalComercial)
    private readonly canalRepo: Repository<CanalComercial>,
    @InjectRepository(Vendedor)
    private readonly vendedorRepo: Repository<Vendedor>,
  ) {}

  @Get('vendedores/:vendedorId/clientes')
  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF, RolUsuario.SUPERVISOR, RolUsuario.VENDEDOR)
  async listByVendedor(@Param('vendedorId') vendedorId: string) {
    const user = await this.usuarioRepo.findOneBy({ id: vendedorId } as any);
    if (!user || user.rol !== 'vendedor' || user.estado !== 'activo') {
      throw new BadRequestException('Vendedor invalido o inactivo');
    }

    const vendedor = await this.vendedorRepo.findOneBy({ usuario_id: vendedorId } as any);
    if (!vendedor || vendedor.activo === false) {
      throw new BadRequestException('Vendedor no activo');
    }

    const qb = this.clienteRepo
      .createQueryBuilder('c')
      .leftJoin(Usuario, 'u', 'u.id = c.usuario_id')
      .leftJoin(Perfil, 'p', 'p.usuario_id = c.usuario_id')
      .leftJoin(CanalComercial, 'canal', 'canal.id = c.canal_id')
      .select([
        'c.usuario_id as usuario_id',
        'c.usuario_id as cliente_id',
        'c.canal_id as canal_id',
        'c.nombre_comercial as nombre_comercial',
        'c.ruc as ruc',
        'c.zona_id as zona_id',
        'c.direccion as direccion',
        'c.latitud as latitud',
        'c.longitud as longitud',
        'c.vendedor_asignado_id as vendedor_asignado_id',
        'c.creado_en as creado_en',
        'u.email as email',
        'u.estado as estado',
        'p.nombres as nombres',
        'p.apellidos as apellidos',
        'p.telefono as telefono',
        'canal.nombre as canal_nombre',
        'canal.codigo as canal_codigo',
      ])
      .where('c.vendedor_asignado_id = :vendedorId', { vendedorId })
      .andWhere('u.estado = :estado', { estado: 'activo' })
      .orderBy('p.nombres', 'ASC');

    return qb.getRawMany();
  }

  @Get('zonas/:zonaId/clientes')
  @Roles(RolUsuario.ADMIN, RolUsuario.STAFF, RolUsuario.SUPERVISOR)
  async listByZona(@Param('zonaId') zonaId: string) {
    const qb = this.clienteRepo
      .createQueryBuilder('c')
      .leftJoin(Usuario, 'u', 'u.id = c.usuario_id')
      .leftJoin(Perfil, 'p', 'p.usuario_id = c.usuario_id')
      .leftJoin(CanalComercial, 'canal', 'canal.id = c.canal_id')
      .select([
        'c.usuario_id as usuario_id',
        'c.usuario_id as cliente_id',
        'c.canal_id as canal_id',
        'c.nombre_comercial as nombre_comercial',
        'c.ruc as ruc',
        'c.zona_id as zona_id',
        'c.direccion as direccion',
        'c.latitud as latitud',
        'c.longitud as longitud',
        'c.vendedor_asignado_id as vendedor_asignado_id',
        'c.creado_en as creado_en',
        'u.email as email',
        'u.estado as estado',
        'p.nombres as nombres',
        'p.apellidos as apellidos',
        'p.telefono as telefono',
        'canal.nombre as canal_nombre',
        'canal.codigo as canal_codigo',
      ])
      .where('c.zona_id = :zonaId', { zonaId })
      .andWhere('u.estado = :estado', { estado: 'activo' })
      .orderBy('c.creado_en', 'DESC');

    return qb.getRawMany();
  }
}

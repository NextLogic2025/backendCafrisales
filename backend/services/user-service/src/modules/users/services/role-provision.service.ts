import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { CreateUserDto } from '../dto/create-user.dto';
import { insertOrIgnore } from '../../../common/utils/db.utils';

@Injectable()
export class RoleProvisionService {
  async provisionRole(manager: EntityManager, userId: string, dto: CreateUserDto) {
    switch ((dto as any).rol) {
      case 'cliente':
        return this.createCliente(manager, userId, dto);
      case 'vendedor':
        return this.createStaff(
          manager,
          'app.vendedores',
          userId,
          dto.vendedor?.codigo_empleado || (dto as any).codigo_empleado,
          { supervisor_id: dto.vendedor?.supervisor_id || null },
        );
      case 'supervisor':
        return this.createStaff(
          manager,
          'app.supervisores',
          userId,
          dto.supervisor?.codigo_empleado || (dto as any).codigo_empleado,
        );
      case 'bodeguero':
        return this.createStaff(
          manager,
          'app.bodegueros',
          userId,
          dto.bodeguero?.codigo_empleado || (dto as any).codigo_empleado,
        );
      default:
        return; // no-op for unsupported roles
    }
  }

  private async createStaff(
    manager: EntityManager,
    tableName: string,
    userId: string,
    codigo: string,
    extraFields: object = {},
  ) {
    if (!codigo) return;
    // Use parameterized raw SQL with ON CONFLICT DO NOTHING to avoid QueryBuilder mapping issues
    if (tableName === 'app.supervisores') {
      await insertOrIgnore(manager, 'app.supervisores', { usuario_id: userId, codigo_empleado: codigo }, '(usuario_id)');
      return;
    }

    if (tableName === 'app.vendedores') {
      const supervisorId = (extraFields as any).supervisor_id || null;
      await insertOrIgnore(
        manager,
        'app.vendedores',
        { usuario_id: userId, codigo_empleado: codigo, supervisor_id: supervisorId, activo: true },
        '(usuario_id)',
      );
      return;
    }

    if (tableName === 'app.bodegueros') {
      await insertOrIgnore(manager, 'app.bodegueros', { usuario_id: userId, codigo_empleado: codigo }, '(usuario_id)');
      return;
    }

    // fallback: try QueryBuilder insert
    await manager
      .createQueryBuilder()
      .insert()
      .into(tableName)
      .values({ usuario_id: userId, codigo_empleado: codigo, ...extraFields } as any)
      .orIgnore()
      .execute();
  }

  private async createCliente(manager: EntityManager, userId: string, dto: CreateUserDto) {
    if (!dto.cliente) return;
    const c = dto.cliente as any;
    await manager
      .createQueryBuilder()
      .insert()
      .into('app.clientes')
      .values({
        usuario_id: userId,
        nombre_comercial: c.nombre_comercial,
        ruc: c.ruc || null,
        zona_id: c.zona_id,
        canal_id: c.canal_id,
        direccion: c.direccion,
      } as any)
      .orIgnore()
      .execute();

    await manager
      .createQueryBuilder()
      .insert()
      .into('app.condiciones_comerciales_cliente')
      .values({ cliente_id: userId } as any)
      .orIgnore()
      .execute();
  }
}

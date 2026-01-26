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
      case 'transportista':
        return this.createStaff(
          manager,
          'app.transportistas',
          userId,
          dto.transportista?.codigo_empleado || (dto as any).codigo_empleado,
          {
            numero_licencia: dto.transportista?.numero_licencia,
            licencia_vence_en: dto.transportista?.licencia_vence_en || null,
            activo: dto.transportista?.activo ?? true,
          },
        );
      default:
        return; // no-op for unsupported roles
    }
  }

  async clearStaffRecords(manager: EntityManager, userId: string) {
    await manager.query('DELETE FROM app.vendedores WHERE usuario_id = $1', [userId]);
    await manager.query('DELETE FROM app.bodegueros WHERE usuario_id = $1', [userId]);
    await manager.query('DELETE FROM app.transportistas WHERE usuario_id = $1', [userId]);
    await manager.query('DELETE FROM app.supervisores WHERE usuario_id = $1', [userId]);
  }

  private async createStaff(
    manager: EntityManager,
    tableName: string,
    userId: string,
    codigo: string,
    extraFields: object = {},
  ) {
    if (!codigo) return;
    if (tableName === 'app.transportistas') {
      if (!(extraFields as any).numero_licencia) return;
      await insertOrIgnore(
        manager,
        'app.transportistas',
        {
          usuario_id: userId,
          codigo_empleado: codigo,
          numero_licencia: (extraFields as any).numero_licencia,
          licencia_vence_en: (extraFields as any).licencia_vence_en || null,
          activo: (extraFields as any).activo ?? true,
        },
        '(usuario_id)',
      );
      return;
    }
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
        latitud: c.latitud || null,
        longitud: c.longitud || null,
        vendedor_asignado_id: c.vendedor_asignado_id || null,
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

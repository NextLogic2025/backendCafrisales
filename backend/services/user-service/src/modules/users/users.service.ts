import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { RolUsuario } from '../../common/enums/rol-usuario.enum';
import { Perfil } from '../profiles/entities/perfil.entity';
import { Cliente } from '../clients/entities/cliente.entity';
import { CondicionesComercialesCliente } from '../clients/entities/condiciones.entity';
import { Outbox } from '../outbox/entities/outbox.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly dataSource: DataSource) {}

  async create(dto: CreateUserDto) {
    return this.dataSource.transaction(async manager => {
      const usuarioRepo = manager.getRepository(Usuario);
      const perfilRepo = manager.getRepository(Perfil);
      const clienteRepo = manager.getRepository(Cliente);
      const outboxRepo = manager.getRepository(Outbox);

      const usuario = usuarioRepo.create({ email: dto.email, rol: dto.rol, creado_por: (dto as any).creado_por || null } as any);
      const savedUser = (await usuarioRepo.save(usuario)) as any;

      if (dto.perfil) {
        const perfil = perfilRepo.create({ usuario_id: savedUser.id, ...dto.perfil } as any);
        await perfilRepo.save(perfil);
      }

      if (dto.rol === 'cliente' && dto.cliente) {
          const cliente = clienteRepo.create({ usuario_id: savedUser.id, ...dto.cliente } as any);
          await clienteRepo.save(cliente);

          // ensure condiciones_comerciales_cliente exists (create empty or with provided values)
          const condicionesPayload = (dto.cliente as any).condiciones || {};
          try {
            const condicionesRepo = manager.getRepository(CondicionesComercialesCliente);
            await condicionesRepo.save({
              cliente_id: savedUser.id,
              permite_negociacion: condicionesPayload.permite_negociacion ?? null,
              porcentaje_descuento_max: condicionesPayload.porcentaje_descuento_max ?? null,
              requiere_aprobacion_supervisor: condicionesPayload.requiere_aprobacion_supervisor ?? null,
              observaciones: condicionesPayload.observaciones ?? null,
            } as any);
          } catch (err) {
            // fallback: raw insert with ON CONFLICT DO NOTHING
            await manager.query(
              `INSERT INTO app.condiciones_comerciales_cliente(cliente_id, permite_negociacion, porcentaje_descuento_max, requiere_aprobacion_supervisor, observaciones, actualizado_en)
               VALUES ($1,$2,$3,$4,$5,transaction_timestamp()) ON CONFLICT (cliente_id) DO NOTHING`,
              [
                savedUser.id,
                condicionesPayload.permite_negociacion,
                condicionesPayload.porcentaje_descuento_max,
                condicionesPayload.requiere_aprobacion_supervisor,
                condicionesPayload.observaciones || null,
              ],
            );
          }
      }

      // supervisor / vendedor: insert via raw query matching DDL to avoid entity mismatch
      if (dto.rol === RolUsuario.SUPERVISOR && dto.supervisor) {
        await manager.query(
          `INSERT INTO app.supervisores(usuario_id, codigo_empleado, creado_en) VALUES ($1,$2,transaction_timestamp())`,
          [savedUser.id, dto.supervisor.codigo_empleado],
        );
      }

      if (dto.rol === RolUsuario.VENDEDOR && dto.vendedor) {
        // resolve supervisor by id or email; if not exists, create supervisor user
        let supervisorId = dto.vendedor.supervisor_id || null;
        if (!supervisorId && (dto.vendedor as any).supervisor_email) {
          const supervisorEmail = (dto.vendedor as any).supervisor_email;
          // try raw query to avoid repository caching/typing issues
          const rows: any[] = await manager.query(`SELECT id FROM app.usuarios WHERE email = $1`, [supervisorEmail]);
          if (rows && rows.length > 0) {
            supervisorId = rows[0].id;
          } else {
            const supUser = usuarioRepo.create({ email: supervisorEmail, rol: RolUsuario.SUPERVISOR } as any);
            const savedSup = await usuarioRepo.save(supUser);
            // create supervisors row
            await manager.query(
              `INSERT INTO app.supervisores(usuario_id, codigo_empleado, creado_en) VALUES ($1,$2,transaction_timestamp())`,
              [(savedSup as any).id, `SUP-${Date.now()}`],
            );
            supervisorId = (savedSup as any).id;
          }
        }

        await manager.query(
          `INSERT INTO app.vendedores(usuario_id, codigo_empleado, supervisor_id, activo, creado_en) VALUES ($1,$2,$3,true,transaction_timestamp())`,
          [savedUser.id, dto.vendedor.codigo_empleado, supervisorId || null],
        );
      }

      if (dto.rol === RolUsuario.BODEGUERO && dto.bodeguero) {
        await manager.query(
          `INSERT INTO app.bodegueros(usuario_id, codigo_empleado, creado_en) VALUES ($1,$2,transaction_timestamp())`,
          [savedUser.id, dto.bodeguero.codigo_empleado],
        );
      }

      const outbox = outboxRepo.create({
        agregado: 'user',
        tipo_evento: 'UsuarioCreado',
        clave_agregado: savedUser.id,
        payload: { id: savedUser.id, email: savedUser.email, rol: savedUser.rol },
      } as any);
      await outboxRepo.save(outbox);

      return savedUser;
    });
  }

  async findById(id: string) {
    return this.dataSource.getRepository(Usuario).findOneBy({ id } as any);
  }

  async update(id: string, patch: Partial<Usuario>) {
    await this.dataSource.getRepository(Usuario).update(id, patch as any);
    return this.findById(id);
  }
}

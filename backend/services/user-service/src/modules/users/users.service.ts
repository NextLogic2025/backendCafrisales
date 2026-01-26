import { Injectable, Logger, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { Perfil } from '../profiles/entities/perfil.entity';
import { Cliente } from '../clients/entities/cliente.entity';
import { CondicionesComercialesCliente } from '../clients/entities/condiciones.entity';
import { Outbox } from '../outbox/entities/outbox.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { RoleProvisionService } from './services/role-provision.service';
import { ProfilesService } from './services/profiles.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly roleProvision: RoleProvisionService,
    private readonly profilesService: ProfilesService,
  ) {}

  async create(dto: CreateUserDto) {
    return this.dataSource.transaction(async manager => {
      const usuarioRepo = manager.getRepository(Usuario);
      const perfilRepo = manager.getRepository(Perfil);
      const clienteRepo = manager.getRepository(Cliente);
      const outboxRepo = manager.getRepository(Outbox);

      const usuarioPayload: any = { email: dto.email, rol: dto.rol, creado_por: (dto as any).creado_por || null };
      if ((dto as any).id) usuarioPayload.id = (dto as any).id;
      const usuario = usuarioRepo.create(usuarioPayload as any);
      const savedUser = (await usuarioRepo.save(usuario)) as any;

      // Delegate profile creation to ProfilesService
      await this.profilesService.create(manager, savedUser.id, dto as any);

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
            // fallback: idempotent insert with ON CONFLICT DO NOTHING via helper
            const { insertOrIgnore } = await import('../../common/utils/db.utils');
            await insertOrIgnore(manager, 'app.condiciones_comerciales_cliente', {
              cliente_id: savedUser.id,
              permite_negociacion: condicionesPayload.permite_negociacion ?? null,
              porcentaje_descuento_max: condicionesPayload.porcentaje_descuento_max ?? null,
              requiere_aprobacion_supervisor: condicionesPayload.requiere_aprobacion_supervisor ?? null,
              observaciones: condicionesPayload.observaciones || null,
              actualizado_en: () => 'transaction_timestamp()',
            }, '(cliente_id)');
          }
      }

      // Delegate role-specific provisioning to RoleProvisionService (SRP)
      try {
        await this.roleProvision.provisionRole(manager, savedUser.id, dto as any);
      } catch (err) {
        // Re-throw conflicts so caller/internal-controller can surface 409
        if (err && err.name && err.name.includes('Conflict')) throw err;
        throw err;
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
    return this.dataSource.transaction(async manager => {
      const usuarioRepo = manager.getRepository(Usuario);
      const perfilRepo = manager.getRepository(Perfil);
      const current = await usuarioRepo.findOneBy({ id } as any);
      if (!current) throw new NotFoundException('Usuario no encontrado');

      const nextRole = (patch as any).rol as string | undefined;
      const updates: Partial<Usuario> = {};
      const perfilPayload = (patch as any).perfil as Partial<Perfil> | undefined;

      if ((patch as any).email) updates.email = (patch as any).email;
      if ((patch as any).estado) updates.estado = (patch as any).estado;
      if (nextRole) updates.rol = nextRole as any;

      if (nextRole && nextRole !== current.rol) {
        const codigoEmpleado =
          (patch as any).codigo_empleado ||
          (patch as any).codigoEmpleado ||
          (patch as any).vendedor?.codigo_empleado ||
          (patch as any).bodeguero?.codigo_empleado ||
          (patch as any).transportista?.codigo_empleado ||
          (patch as any).supervisor?.codigo_empleado ||
          null;

        const supervisorId =
          (patch as any).supervisor_id ||
          (patch as any).supervisorId ||
          (patch as any).vendedor?.supervisor_id ||
          null;

        const numeroLicencia =
          (patch as any).numero_licencia ||
          (patch as any).numeroLicencia ||
          (patch as any).transportista?.numero_licencia ||
          null;

        const licenciaVenceEn =
          (patch as any).licencia_vence_en ||
          (patch as any).licenciaVenceEn ||
          (patch as any).transportista?.licencia_vence_en ||
          null;

        if (['vendedor', 'bodeguero', 'transportista', 'supervisor'].includes(nextRole) && !codigoEmpleado) {
          throw new BadRequestException('codigo_empleado requerido para el rol');
        }

        if (nextRole === 'transportista' && !numeroLicencia) {
          throw new BadRequestException('numero_licencia requerido para transportista');
        }

        const rolePayload: any = { rol: nextRole, codigo_empleado: codigoEmpleado };

        if (nextRole === 'vendedor') {
          rolePayload.vendedor = { codigo_empleado: codigoEmpleado, supervisor_id: supervisorId || null };
        }
        if (nextRole === 'bodeguero') {
          rolePayload.bodeguero = { codigo_empleado: codigoEmpleado };
        }
        if (nextRole === 'supervisor') {
          rolePayload.supervisor = { codigo_empleado: codigoEmpleado };
        }
        if (nextRole === 'transportista') {
          rolePayload.transportista = {
            codigo_empleado: codigoEmpleado,
            numero_licencia: numeroLicencia,
            licencia_vence_en: licenciaVenceEn || null,
          };
        }

        await this.roleProvision.clearStaffRecords(manager, id);
        await this.roleProvision.provisionRole(manager, id, rolePayload as any);
      }

      if (Object.keys(updates).length > 0) {
        await usuarioRepo.update({ id } as any, updates as any);
      }

      if (perfilPayload) {
        const exists = await perfilRepo.findOneBy({ usuario_id: id } as any);
        if (exists) {
          await perfilRepo.update({ usuario_id: id } as any, perfilPayload as any);
        } else {
          await perfilRepo.save({ usuario_id: id, ...perfilPayload } as any);
        }
      }

      return this.findById(id);
    });
  }
}

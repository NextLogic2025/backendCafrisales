import { Injectable, Logger, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { Perfil } from '../profiles/entities/perfil.entity';
import { Cliente } from '../clients/entities/cliente.entity';
import { CondicionesComercialesCliente } from '../clients/entities/condiciones.entity';
import { Outbox } from '../outbox/entities/outbox.entity';
import { CanalComercial } from '../channels/entities/canal-comercial.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { RoleProvisionService } from './services/role-provision.service';
import { ProfilesService } from './services/profiles.service';
import { ZoneExternalService } from '../../services/zone-external.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly roleProvision: RoleProvisionService,
    private readonly profilesService: ProfilesService,
    private readonly zoneExternalService: ZoneExternalService,
  ) { }

  private splitName(nombre: string) {
    const parts = nombre.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return { nombres: 'Usuario', apellidos: '' };
    if (parts.length === 1) return { nombres: parts[0], apellidos: '' };
    return { nombres: parts.slice(0, -1).join(' '), apellidos: parts[parts.length - 1] };
  }

  private buildPerfil(dto: CreateUserDto) {
    if (dto.perfil?.nombres && dto.perfil?.apellidos) {
      return dto.perfil;
    }

    const nombreBase =
      (dto as any).nombre ||
      (dto as any).name ||
      (dto as any).perfil?.nombres ||
      (dto.email ? dto.email.split('@')[0] : 'Usuario');
    const parsed = this.splitName(nombreBase || 'Usuario');

    return {
      nombres: parsed.nombres,
      apellidos: parsed.apellidos,
      telefono: (dto as any).telefono || dto.perfil?.telefono || null,
    } as any;
  }

  private async buildClientePayload(manager: any, dto: CreateUserDto) {
    if (dto.cliente) return dto.cliente as any;
    if ((dto as any).rol !== 'cliente') return null;

    const canalRepo = manager.getRepository(CanalComercial);
    const canal = await canalRepo.findOne({ where: { codigo: 'minorista', activo: true } as any });
    if (!canal) {
      throw new BadRequestException('No existe un canal minorista activo para crear el cliente');
    }

    const zonaId = process.env.DEFAULT_ZONA_ID;
    if (!zonaId) {
      throw new BadRequestException('DEFAULT_ZONA_ID requerido para crear clientes sin zona');
    }

    const direccion = process.env.DEFAULT_CLIENTE_DIRECCION || 'Pendiente';
    return {
      canal_id: canal.id,
      nombre_comercial: dto.email || 'Cliente',
      ruc: null,
      zona_id: zonaId,
      direccion,
      latitud: null,
      longitud: null,
      vendedor_asignado_id: null,
    } as any;
  }

  async create(dto: CreateUserDto) {
    const role = ((dto as any).rol || 'cliente') as any;

    // Validation logic for zone (NEW)
    let zonaToValidate: string | null = null;

    if (role === 'cliente') {
      const payload = (dto.cliente || {});
      if ('zona_id' in payload) zonaToValidate = (payload as any).zona_id;

      if (dto.cliente && dto.cliente.zona_id) {
        zonaToValidate = dto.cliente.zona_id;
      }
    }

    if (zonaToValidate) {
      const zone = await this.zoneExternalService.getZoneById(zonaToValidate);
      if (!zone) {
        throw new BadRequestException('La zona especificada no es válida o no existe.');
      }
    }

    return this.dataSource.transaction(async manager => {
      const usuarioRepo = manager.getRepository(Usuario);
      const perfilRepo = manager.getRepository(Perfil);
      const clienteRepo = manager.getRepository(Cliente);
      const outboxRepo = manager.getRepository(Outbox);

      // Re-build payloads inside transaction as before
      const perfilPayload = this.buildPerfil(dto);
      const clientePayload = await this.buildClientePayload(manager, { ...dto, rol: role } as any);

      const usuarioPayload: any = {
        email: dto.email,
        rol: role,
        creado_por: (dto as any).creado_por || null,
      };
      if ((dto as any).id) usuarioPayload.id = (dto as any).id;
      const usuario = usuarioRepo.create(usuarioPayload as any);
      const savedUser = (await usuarioRepo.save(usuario)) as any;

      // Delegate profile creation to ProfilesService
      await this.profilesService.create(manager, savedUser.id, { ...(dto as any), perfil: perfilPayload } as any);

      if (role === 'cliente' && clientePayload) {
        const cliente = clienteRepo.create({
          usuario_id: savedUser.id,
          ...clientePayload,
          creado_por: (dto as any).creado_por || null,
        } as any);
        const savedCliente = (await clienteRepo.save(cliente as any)) as Cliente;

        // ensure condiciones_comerciales_cliente exists (create empty or with provided values)
        const condicionesPayload = (clientePayload as any).condiciones || {};
        try {
          const condicionesRepo = manager.getRepository(CondicionesComercialesCliente);
          await condicionesRepo.save({
            cliente_id: savedUser.id,
            permite_negociacion: condicionesPayload.permite_negociacion ?? null,
            porcentaje_descuento_max: condicionesPayload.porcentaje_descuento_max ?? null,
            requiere_aprobacion_supervisor: condicionesPayload.requiere_aprobacion_supervisor ?? false,
            observaciones: condicionesPayload.observaciones ?? null,
          } as any);
        } catch (err) {
          // fallback: idempotent insert with ON CONFLICT DO NOTHING via helper
          const { insertOrIgnore } = await import('../../common/utils/db.utils');
          await insertOrIgnore(manager, 'app.condiciones_comerciales_cliente', {
            cliente_id: savedUser.id,
            permite_negociacion: condicionesPayload.permite_negociacion ?? null,
            porcentaje_descuento_max: condicionesPayload.porcentaje_descuento_max ?? null,
            requiere_aprobacion_supervisor: condicionesPayload.requiere_aprobacion_supervisor ?? false,
            observaciones: condicionesPayload.observaciones || null,
          }, '(cliente_id)');
        }

        await outboxRepo.save(outboxRepo.create({
          agregado: 'user',
          tipo_evento: 'ClienteCreado',
          clave_agregado: savedUser.id,
          payload: {
            usuario_id: savedUser.id,
            canal_id: savedCliente.canal_id,
            zona_id: savedCliente.zona_id,
          },
        } as any));
      }

      // Delegate role-specific provisioning to RoleProvisionService (SRP)
      try {
        if (role !== 'cliente') {
          await this.roleProvision.provisionRole(manager, savedUser.id, { ...(dto as any), rol: role } as any);
        }
      } catch (err) {
        // Re-throw conflicts so caller/internal-controller can surface 409
        if (err && err.name && err.name.includes('Conflict')) throw err;
        throw err;
      }

      if (role === 'vendedor') {
        await outboxRepo.save(outboxRepo.create({
          agregado: 'user',
          tipo_evento: 'VendedorCreado',
          clave_agregado: savedUser.id,
          payload: { usuario_id: savedUser.id, codigo_empleado: (dto as any).codigo_empleado || dto.vendedor?.codigo_empleado },
        } as any));
      }

      if (role === 'transportista') {
        await outboxRepo.save(outboxRepo.create({
          agregado: 'user',
          tipo_evento: 'TransportistaCreado',
          clave_agregado: savedUser.id,
          payload: { usuario_id: savedUser.id, codigo_empleado: (dto as any).codigo_empleado || dto.transportista?.codigo_empleado },
        } as any));
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

  async findByRole(rol: string) {
    return this.dataSource.getRepository(Usuario).find({
      where: { rol } as any,
      select: ['id', 'email', 'rol'],
    });
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

  async suspend(id: string, actorId: string | null, motivo?: string) {
    return this.dataSource.transaction(async manager => {
      const usuarioRepo = manager.getRepository(Usuario);
      const outboxRepo = manager.getRepository(Outbox);

      const current = await usuarioRepo.findOneBy({ id } as any);
      if (!current) throw new NotFoundException('Usuario no encontrado');

      if (current.estado !== 'suspendido') {
        await usuarioRepo.update(
          { id } as any,
          {
            estado: 'suspendido',
            actualizado_por: actorId || null,
            actualizado_en: new Date(),
          } as any,
        );

        if (current.rol === 'vendedor') {
          await manager.query('UPDATE app.vendedores SET activo = false WHERE usuario_id = $1', [id]);
        }

        if (current.rol === 'transportista') {
          await manager.query('UPDATE app.transportistas SET activo = false WHERE usuario_id = $1', [id]);
        }

        await outboxRepo.save(
          outboxRepo.create({
            agregado: 'user',
            tipo_evento: 'UsuarioSuspendido',
            clave_agregado: id,
            payload: {
              usuario_id: id,
              suspendido_por: actorId || null,
              motivo: motivo || null,
            },
          } as any),
        );
      }

      return this.findById(id);
    });
  }
}

import { Injectable, Logger, ConflictException } from '@nestjs/common';
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
    await this.dataSource.getRepository(Usuario).update(id, patch as any);
    return this.findById(id);
  }
}

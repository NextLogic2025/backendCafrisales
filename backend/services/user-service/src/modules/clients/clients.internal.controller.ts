import {
  Controller,
  Get,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Cliente } from './entities/cliente.entity';
import { CondicionesComercialesCliente } from './entities/condiciones.entity';
import { Usuario } from '../users/entities/usuario.entity';
import { Perfil } from '../profiles/entities/perfil.entity';
import { CanalComercial } from '../channels/entities/canal-comercial.entity';

@Controller('internal/clientes')
@UseGuards(RolesGuard)
export class ClientsInternalController {
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

  @Get(':usuarioId')
  async getByUsuarioId(@Param('usuarioId') usuarioId: string, @Req() req: any) {
    this.assertServiceToken(req);
    const cliente = await this.clienteRepo.findOneBy({ usuario_id: usuarioId } as any);
    if (!cliente) {
      throw new NotFoundException();
    }

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

  @Get(':usuarioId/condiciones')
  async getCondiciones(@Param('usuarioId') usuarioId: string, @Req() req: any) {
    this.assertServiceToken(req);
    const cliente = await this.clienteRepo.findOneBy({ usuario_id: usuarioId } as any);
    if (!cliente) {
      throw new NotFoundException();
    }

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

  private assertServiceToken(req: any) {
    const svcToken = req.headers['x-service-token'] || req.headers['service-token'];
    if (!svcToken || svcToken !== process.env.SERVICE_TOKEN) {
      throw new ForbiddenException('Servicio no autorizado');
    }
  }
}

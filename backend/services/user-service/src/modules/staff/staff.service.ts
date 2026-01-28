import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vendedor } from './entities/vendedor.entity';
import { Supervisor } from './entities/supervisor.entity';
import { Bodeguero } from './entities/bodeguero.entity';
import { Transportista } from './entities/transportista.entity';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(Vendedor) private readonly vendedoresRepo: Repository<Vendedor>,
    @InjectRepository(Supervisor) private readonly supervisoresRepo: Repository<Supervisor>,
    @InjectRepository(Bodeguero) private readonly bodeguerosRepo: Repository<Bodeguero>,
    @InjectRepository(Transportista) private readonly transportistasRepo: Repository<Transportista>,
  ) {}

  listVendedores() {
    return this.vendedoresRepo.find({ where: { activo: true } });
  }

  listSupervisores() {
    return this.supervisoresRepo.find();
  }

  listBodegueros() {
    return this.bodeguerosRepo.find();
  }

  listTransportistas() {
    return this.transportistasRepo.find({ where: { activo: true } });
  }
}

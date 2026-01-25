import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Usuario)
    private readonly repo: Repository<Usuario>,
  ) {}

  async create(user: Partial<Usuario>) {
    const entity = this.repo.create(user as any);
    const saved = (await this.repo.save(entity)) as unknown as Usuario;
    return saved;
  }

  async findById(id: string) {
    return this.repo.findOneBy({ id } as any);
  }

  async update(id: string, patch: Partial<Usuario>) {
    await this.repo.update(id, patch as any);
    return this.findById(id);
  }
}

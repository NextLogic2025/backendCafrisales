import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Perfil } from '../../profiles/entities/perfil.entity';
import { CreateUserDto } from '../dto/create-user.dto';

@Injectable()
export class ProfilesService {
  async create(manager: EntityManager, userId: string, dto: CreateUserDto) {
    if (!dto.perfil) return null;
    const profileRepo = manager.getRepository(Perfil);
    const perfil = profileRepo.create({
      usuario_id: userId,
      nombres: (dto.perfil as any).nombres,
      apellidos: (dto.perfil as any).apellidos,
      telefono: (dto.perfil as any).telefono || null,
      url_avatar: (dto as any).avatarUrl || null,
      preferencias: (dto as any).preferencias || {},
    } as any);
    return profileRepo.save(perfil);
  }
}

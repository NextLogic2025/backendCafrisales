import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Zone } from './entities/zone.entity';
import { CreateZoneDto } from './dto/create-zone.dto';
import { OutboxService } from '../outbox/outbox.service';

@Injectable()
export class ZonesService {
    constructor(
        @InjectRepository(Zone)
        private readonly zonesRepository: Repository<Zone>,
        private readonly outboxService: OutboxService,
    ) { }

    async create(createZoneDto: CreateZoneDto, userId?: string): Promise<Zone> {
        const existing = await this.zonesRepository.findOne({ where: { codigo: createZoneDto.codigo } });
        if (existing) {
            throw new ConflictException('El codigo ya esta registrado');
        }

        const zone = this.zonesRepository.create({
            ...createZoneDto,
            zona_geom: createZoneDto.zonaGeom,
            creadoPor: userId ?? createZoneDto?.['creadoPor'],
            actualizadoPor: userId ?? createZoneDto?.['creadoPor'],
        });
        const saved = await this.zonesRepository.save(zone);
        await this.outboxService.createEvent('ZonaCreada', saved.id, {
            zona_id: saved.id,
            codigo: saved.codigo,
            nombre: saved.nombre,
        });
        return saved;
    }

    async findAll(status?: string, activo?: string): Promise<Zone[]> {
        if (activo !== undefined) {
            return this.zonesRepository.find({ where: { activo: activo === 'true' } });
        }
        const normalized = (status || 'activo').toLowerCase();

        if (normalized === 'todos' || normalized === 'all') {
            return this.zonesRepository.find();
        }

        if (normalized === 'inactivo' || normalized === 'inactiva') {
            return this.zonesRepository.find({ where: { activo: false } });
        }

        return this.zonesRepository.find({ where: { activo: true } });
    }

    async findOne(id: string): Promise<Zone> {
        const zone = await this.zonesRepository.findOne({ where: { id } });
        if (!zone) {
            throw new NotFoundException(`Zone with ID ${id} not found`);
        }
        return zone;
    }
    async update(id: string, updateData: Partial<CreateZoneDto>, userId?: string): Promise<Zone> {
        const zone = await this.findOne(id);

        if (updateData.codigo && updateData.codigo !== zone.codigo) {
            const existing = await this.zonesRepository.findOne({ where: { codigo: updateData.codigo } });
            if (existing) {
                throw new ConflictException('El codigo ya esta registrado');
            }
        }

        // Handle geometry if present in updateData (optional)
        if (updateData.zonaGeom) {
            zone.zona_geom = updateData.zonaGeom;
            delete updateData.zonaGeom;
        }

        if (userId) {
            zone.actualizadoPor = userId;
        }
        this.zonesRepository.merge(zone, updateData);
        const saved = await this.zonesRepository.save(zone);
        await this.outboxService.createEvent('ZonaActualizada', saved.id, {
            zona_id: saved.id,
            codigo: saved.codigo,
            nombre: saved.nombre,
        });
        return saved;
    }

    async updateGeometry(id: string, geometry: object, userId?: string): Promise<Zone> {
        const zone = await this.findOne(id);
        zone.zona_geom = geometry;
        if (userId) {
            zone.actualizadoPor = userId;
        }
        const saved = await this.zonesRepository.save(zone);
        await this.outboxService.createEvent('ZonaActualizada', saved.id, {
            zona_id: saved.id,
            codigo: saved.codigo,
            nombre: saved.nombre,
        });
        return saved;
    }

    async deactivate(id: string, userId?: string): Promise<Zone> {
        const zone = await this.findOne(id);
        zone.activo = false;
        if (userId) {
            zone.actualizadoPor = userId;
        }
        const saved = await this.zonesRepository.save(zone);
        await this.outboxService.createEvent('ZonaDesactivada', saved.id, {
            zona_id: saved.id,
            codigo: saved.codigo,
            nombre: saved.nombre,
        });
        return saved;
    }
}

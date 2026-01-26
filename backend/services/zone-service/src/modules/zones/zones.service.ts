import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Zone } from './entities/zone.entity';
import { CreateZoneDto } from './dto/create-zone.dto';

@Injectable()
export class ZonesService {
    constructor(
        @InjectRepository(Zone)
        private readonly zonesRepository: Repository<Zone>,
    ) { }

    async create(createZoneDto: CreateZoneDto, userId?: string): Promise<Zone> {
        const zone = this.zonesRepository.create({
            ...createZoneDto,
            zona_geom: createZoneDto.zonaGeom,
            creadoPor: userId ?? createZoneDto?.['creadoPor'],
            actualizadoPor: userId ?? createZoneDto?.['creadoPor'],
        });
        return this.zonesRepository.save(zone);
    }

    async findAll(status?: string): Promise<Zone[]> {
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

        // Handle geometry if present in updateData (optional)
        if (updateData.zonaGeom) {
            zone.zona_geom = updateData.zonaGeom;
            delete updateData.zonaGeom;
        }

        if (userId) {
            zone.actualizadoPor = userId;
        }
        this.zonesRepository.merge(zone, updateData);
        return this.zonesRepository.save(zone);
    }

    async updateGeometry(id: string, geometry: object, userId?: string): Promise<Zone> {
        const zone = await this.findOne(id);
        zone.zona_geom = geometry;
        if (userId) {
            zone.actualizadoPor = userId;
        }
        return this.zonesRepository.save(zone);
    }
}

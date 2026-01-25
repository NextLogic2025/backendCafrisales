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

    async create(createZoneDto: CreateZoneDto): Promise<Zone> {
        const zone = this.zonesRepository.create({
            ...createZoneDto,
            zona_geom: createZoneDto.zonaGeom,
        });
        return this.zonesRepository.save(zone);
    }

    async findAll(): Promise<Zone[]> {
        return this.zonesRepository.find({ where: { activo: true } });
    }

    async findOne(id: string): Promise<Zone> {
        const zone = await this.zonesRepository.findOne({ where: { id } });
        if (!zone) {
            throw new NotFoundException(`Zone with ID ${id} not found`);
        }
        return zone;
    }
    async update(id: string, updateData: Partial<CreateZoneDto>): Promise<Zone> {
        const zone = await this.findOne(id);

        // Handle geometry if present in updateData (optional)
        if (updateData.zonaGeom) {
            zone.zona_geom = updateData.zonaGeom;
            delete updateData.zonaGeom;
        }

        this.zonesRepository.merge(zone, updateData);
        return this.zonesRepository.save(zone);
    }

    async updateGeometry(id: string, geometry: object): Promise<Zone> {
        const zone = await this.findOne(id);
        zone.zona_geom = geometry;
        return this.zonesRepository.save(zone);
    }
}

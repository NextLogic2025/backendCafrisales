import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Zone } from '../zones/entities/zone.entity';

@Injectable()
export class CoverageService {
    constructor(
        @InjectRepository(Zone)
        private readonly zonesRepository: Repository<Zone>,
    ) { }

    async findZoneByPoint(lat: number, lon: number): Promise<Zone | null> {
        // PostGIS query: ST_Contains(geom, ST_SetSRID(ST_Point(lon, lat), 4326))
        return this.zonesRepository
            .createQueryBuilder('zone')
            .where(
                `ST_Contains(
           zone.zona_geom, 
           ST_SetSRID(ST_Point(:lon, :lat), 4326)
         )`,
                { lon, lat },
            )
            .andWhere('zone.activo = true')
            .getOne();
    }
}

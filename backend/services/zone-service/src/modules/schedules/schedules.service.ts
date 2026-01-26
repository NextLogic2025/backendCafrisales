import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Schedule } from './entities/schedule.entity';
import { Zone } from '../zones/entities/zone.entity';
import { OutboxService } from '../outbox/outbox.service';

@Injectable()
export class SchedulesService {
    constructor(
        @InjectRepository(Schedule)
        private readonly schedulesRepository: Repository<Schedule>,
        @InjectRepository(Zone)
        private readonly zonesRepository: Repository<Zone>,
        private readonly dataSource: DataSource,
        private readonly outboxService: OutboxService,
    ) { }

    async findAll(): Promise<Schedule[]> {
        return this.schedulesRepository.find({ relations: ['zona'] });
    }

    async findByZone(zonaId: string): Promise<Schedule[]> {
        return this.schedulesRepository.find({
            where: { zona: { id: zonaId } },
            order: { diaSemana: 'ASC' },
        });
    }

    async replaceForZone(zonaId: string, schedulesData: Partial<Schedule>[], userId?: string): Promise<Schedule[]> {
        const zone = await this.zonesRepository.findOne({ where: { id: zonaId, activo: true } });
        if (!zone) {
            throw new NotFoundException('Zona no encontrada o inactiva');
        }

        const results = await this.dataSource.transaction(async (manager) => {
            await manager.delete(Schedule, { zona: { id: zonaId } as any });

            const created: Schedule[] = [];
            for (const s of schedulesData) {
                const schedule = manager.create(Schedule, {
                    ...s,
                    zona: { id: zonaId } as any,
                    creadoPor: userId,
                });
                created.push(await manager.save(Schedule, schedule));
            }
            return created;
        });

        await this.outboxService.createEvent('HorariosZonaActualizados', zonaId, {
            zona_id: zonaId,
            horarios_configurados: results.length,
        });

        return results;
    }

    async upsertForZoneDay(zonaId: string, diaSemana: number, payload: Partial<Schedule>, userId?: string) {
        const zone = await this.zonesRepository.findOne({ where: { id: zonaId, activo: true } });
        if (!zone) {
            throw new NotFoundException('Zona no encontrada o inactiva');
        }

        const schedule = await this.schedulesRepository.save({
            zona: { id: zonaId } as any,
            diaSemana,
            entregasHabilitadas: payload.entregasHabilitadas ?? true,
            visitasHabilitadas: payload.visitasHabilitadas ?? true,
            creadoPor: userId,
        });

        return schedule;
    }

    async getAvailabilityForDate(zonaId: string, fecha: string, tipo: 'entregas' | 'visitas') {
        const zone = await this.zonesRepository.findOne({ where: { id: zonaId, activo: true } });
        if (!zone) {
            throw new NotFoundException('Zona no encontrada o inactiva');
        }

        const date = new Date(fecha);
        if (Number.isNaN(date.getTime())) {
            throw new BadRequestException('Fecha invalida');
        }

        const day = date.getDay();
        const schedule = await this.schedulesRepository.findOne({
            where: { zona: { id: zonaId }, diaSemana: day },
        });

        if (!schedule) {
            return { disponible: false, entregas_habilitadas: false, visitas_habilitadas: false };
        }

        return {
            disponible: tipo === 'entregas' ? schedule.entregasHabilitadas : schedule.visitasHabilitadas,
            entregas_habilitadas: schedule.entregasHabilitadas,
            visitas_habilitadas: schedule.visitasHabilitadas,
        };
    }

    async getZonesByScheduleDay(diaSemana: number, tipo: 'entregas' | 'visitas') {
        const whereClause =
            tipo === 'entregas'
                ? { diaSemana, entregasHabilitadas: true, zona: { activo: true } }
                : { diaSemana, visitasHabilitadas: true, zona: { activo: true } };

        const schedules = await this.schedulesRepository.find({
            where: whereClause as any,
            relations: ['zona'],
            order: { zona: { codigo: 'ASC' } } as any,
        });

        return schedules.map((schedule) => schedule.zona);
    }
}

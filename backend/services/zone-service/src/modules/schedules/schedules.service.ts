import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schedule } from './entities/schedule.entity';

@Injectable()
export class SchedulesService {
    constructor(
        @InjectRepository(Schedule)
        private readonly schedulesRepository: Repository<Schedule>,
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

    async updateForZone(zonaId: string, schedulesData: Partial<Schedule>[]): Promise<Schedule[]> {
        // Transactional approach would be better, but for simplicity:
        // 1. Delete existing for this zone? Or update/upsert?
        // Requirement implies replacing or updating. Upsert is safer for "days".
        // Let's assume we receive a list of days to config.

        const results: Schedule[] = [];
        for (const s of schedulesData) {
            // Check if exists
            let schedule = await this.schedulesRepository.findOne({
                where: { zona: { id: zonaId }, diaSemana: s.diaSemana },
            });

            if (!schedule) {
                schedule = this.schedulesRepository.create({
                    ...s,
                    zona: { id: zonaId } as any,
                });
            } else {
                this.schedulesRepository.merge(schedule, s);
            }
            results.push(await this.schedulesRepository.save(schedule));
        }
        return results;
    }
}

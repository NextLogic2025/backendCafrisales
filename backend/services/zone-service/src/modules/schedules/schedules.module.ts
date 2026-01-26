import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';
import { Schedule } from './entities/schedule.entity';
import { Zone } from '../zones/entities/zone.entity';
import { OutboxModule } from '../outbox/outbox.module';

@Module({
    imports: [TypeOrmModule.forFeature([Schedule, Zone]), OutboxModule],
    controllers: [SchedulesController],
    providers: [SchedulesService],
    exports: [SchedulesService],
})
export class SchedulesModule { }

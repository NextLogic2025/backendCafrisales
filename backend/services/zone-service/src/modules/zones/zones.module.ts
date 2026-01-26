import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ZonesService } from './zones.service';
import { ZonesController } from './zones.controller';
import { Zone } from './entities/zone.entity';
import { SchedulesModule } from '../schedules/schedules.module';
import { CoverageModule } from '../coverage/coverage.module';
import { OutboxModule } from '../outbox/outbox.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Zone]),
        SchedulesModule,
        CoverageModule,
        OutboxModule,
    ],
    controllers: [ZonesController],
    providers: [ZonesService],
    exports: [ZonesService],
})
export class ZonesModule { }

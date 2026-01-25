import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoverageService } from './coverage.service';
import { CoverageController } from './coverage.controller';
import { Zone } from '../zones/entities/zone.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Zone])],
    controllers: [CoverageController],
    providers: [CoverageService],
    exports: [CoverageService],
})
export class CoverageModule { }

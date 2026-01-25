import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { TypeOrmHealthIndicator } from '@nestjs/terminus';

@Module({
    imports: [TerminusModule],
    controllers: [HealthController],
    providers: [TypeOrmHealthIndicator],
})
export class HealthModule { }

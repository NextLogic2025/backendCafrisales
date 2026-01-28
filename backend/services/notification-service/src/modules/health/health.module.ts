import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { DebugController } from './debug.controller';

@Module({
    imports: [TerminusModule],
    controllers: [HealthController, DebugController],
})
export class HealthModule { }

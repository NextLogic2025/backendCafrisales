import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditsService } from './credits.service';
import { CreditsController } from './credits.controller';
import { AprobacionCredito } from './entities/aprobacion-credito.entity';

@Module({
    imports: [TypeOrmModule.forFeature([AprobacionCredito])],
    controllers: [CreditsController],
    providers: [CreditsService],
    exports: [CreditsService],
})
export class CreditsModule { }

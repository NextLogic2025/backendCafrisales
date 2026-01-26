import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { AprobacionCredito } from '../credits/entities/aprobacion-credito.entity';
import { PagoCredito } from '../payments/entities/pago-credito.entity';

@Module({
    imports: [TypeOrmModule.forFeature([AprobacionCredito, PagoCredito])],
    controllers: [ReportsController],
    providers: [ReportsService],
})
export class ReportsModule { }

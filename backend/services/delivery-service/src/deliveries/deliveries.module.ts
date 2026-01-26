import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveriesController } from './deliveries.controller';
import { DeliveriesService } from './deliveries.service';
import { Entrega } from './entities/entrega.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Entrega])],
    controllers: [DeliveriesController],
    providers: [DeliveriesService],
    exports: [DeliveriesService],
})
export class DeliveriesModule { }

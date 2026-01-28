import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderConsumerService, OrderOutbox } from './order-consumer.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([OrderOutbox], 'orderConnection'),
        NotificationsModule,
    ],
    providers: [OrderConsumerService],
    exports: [OrderConsumerService],
})
export class ConsumersModule { }

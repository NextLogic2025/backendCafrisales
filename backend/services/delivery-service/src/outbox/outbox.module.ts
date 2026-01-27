import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboxService } from './outbox.service';
import { Outbox } from './entities/outbox.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Outbox])],
    providers: [OutboxService],
    exports: [OutboxService],
})
export class OutboxModule { }

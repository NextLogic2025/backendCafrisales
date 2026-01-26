import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { EvidenceController } from './evidence.controller';
import { EvidenceService } from './evidence.service';
import { EvidenciaEntrega } from './entities/evidencia-entrega.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([EvidenciaEntrega]),
        MulterModule.register({
            dest: process.env.UPLOAD_PATH || './uploads/evidence',
        }),
    ],
    controllers: [EvidenceController],
    providers: [EvidenceService],
    exports: [EvidenceService],
})
export class EvidenceModule { }

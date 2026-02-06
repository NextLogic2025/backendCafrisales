import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { EvidenceController } from './evidence.controller';
import { EvidenceService } from './evidence.service';
import { EvidenciaEntrega } from './entities/evidencia-entrega.entity';
import { StorageProvider } from '../common/providers/storage.provider';

@Module({
    imports: [
        TypeOrmModule.forFeature([EvidenciaEntrega]),
        MulterModule.register(),
    ],
    controllers: [EvidenceController],
    providers: [EvidenceService, StorageProvider],
    exports: [EvidenceService],
})
export class EvidenceModule { }

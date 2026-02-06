import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EvidenciaEntrega } from './entities/evidencia-entrega.entity';
import { UploadEvidenceDto } from './dto/upload-evidence.dto';
import { StorageProvider } from '../common/providers/storage.provider';

@Injectable()
export class EvidenceService {
    private readonly logger = new Logger(EvidenceService.name);

    constructor(
        @InjectRepository(EvidenciaEntrega)
        private readonly evidenciaRepository: Repository<EvidenciaEntrega>,
        private readonly storageProvider: StorageProvider,
    ) { }

    async uploadEvidence(
        entregaId: string,
        file: Express.Multer.File,
        uploadDto: UploadEvidenceDto,
        userId?: string,
        coordinates?: { lat?: number; lng?: number },
    ): Promise<EvidenciaEntrega> {
        this.logger.log(`Uploading evidence for delivery ${entregaId}`);

        // Upload file to GCS
        const url = await this.storageProvider.uploadFile(file, 'evidence');

        const evidencia = this.evidenciaRepository.create({
            entrega_id: entregaId,
            tipo: uploadDto.tipo,
            descripcion: uploadDto.descripcion,
            url: url,
            mime_type: file.mimetype,
            tamano_bytes: file.size,
            meta: {
                original_name: file.originalname,
                latitud: coordinates?.lat,
                longitud: coordinates?.lng,
            },
            creado_por: userId,
        });

        return await this.evidenciaRepository.save(evidencia);
    }

    async createEvidenceFromUrl(
        entregaId: string,
        payload: {
            tipo: string;
            url: string;
            mime_type?: string;
            hash_archivo?: string;
            tamano_bytes?: number;
            descripcion?: string;
            meta?: any;
        },
        userId?: string,
    ): Promise<EvidenciaEntrega> {
        const evidencia = this.evidenciaRepository.create({
            entrega_id: entregaId,
            tipo: payload.tipo as any,
            url: payload.url,
            mime_type: payload.mime_type,
            hash_archivo: payload.hash_archivo,
            tamano_bytes: payload.tamano_bytes,
            descripcion: payload.descripcion,
            meta: payload.meta || {},
            creado_por: userId,
        });

        return this.evidenciaRepository.save(evidencia);
    }

    async findByDelivery(entregaId: string): Promise<EvidenciaEntrega[]> {
        return await this.evidenciaRepository.find({
            where: { entrega_id: entregaId },
            order: { creado_en: 'DESC' },
        });
    }

    async findOne(id: string): Promise<EvidenciaEntrega> {
        const evidencia = await this.evidenciaRepository.findOne({ where: { id } });
        if (!evidencia) {
            throw new NotFoundException(`Evidence with ID ${id} not found`);
        }
        return evidencia;
    }

    async remove(id: string): Promise<void> {
        const evidencia = await this.findOne(id);

        // Delete file from GCS
        if (evidencia.url) {
            await this.storageProvider.deleteFile(evidencia.url);
        }

        await this.evidenciaRepository.remove(evidencia);
        this.logger.log(`Deleted evidence ${id}`);
    }
}

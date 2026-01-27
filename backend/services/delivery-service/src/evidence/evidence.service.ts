import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EvidenciaEntrega } from './entities/evidencia-entrega.entity';
import { UploadEvidenceDto } from './dto/upload-evidence.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EvidenceService {
    private readonly logger = new Logger(EvidenceService.name);
    private readonly uploadPath = process.env.UPLOAD_PATH || './uploads/evidence';

    constructor(
        @InjectRepository(EvidenciaEntrega)
        private readonly evidenciaRepository: Repository<EvidenciaEntrega>,
    ) {
        // Ensure upload directory exists
        if (!fs.existsSync(this.uploadPath)) {
            fs.mkdirSync(this.uploadPath, { recursive: true });
        }
    }

    async uploadEvidence(
        entregaId: string,
        file: Express.Multer.File,
        uploadDto: UploadEvidenceDto,
        userId?: string,
        coordinates?: { lat?: number; lng?: number },
    ): Promise<EvidenciaEntrega> {
        this.logger.log(`Uploading evidence for delivery ${entregaId}`);

        const evidencia = this.evidenciaRepository.create({
            entrega_id: entregaId,
            tipo: uploadDto.tipo,
            descripcion: uploadDto.descripcion,
            url: `/uploads/evidence/${file.filename}`,
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

        // Delete file from filesystem
        const filePath = path.join(process.cwd(), evidencia.url || '');
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            this.logger.log(`Deleted file ${filePath}`);
        }

        await this.evidenciaRepository.remove(evidencia);
        this.logger.log(`Deleted evidence ${id}`);
    }
}

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
            entregaId,
            tipo: uploadDto.tipo,
            descripcion: uploadDto.descripcion,
            archivoUrl: `/uploads/evidence/${file.filename}`,
            archivoNombre: file.originalname,
            archivoSize: file.size,
            mimeType: file.mimetype,
            capturadoPorUserId: userId,
            latitudCaptura: coordinates?.lat,
            longitudCaptura: coordinates?.lng,
        });

        return await this.evidenciaRepository.save(evidencia);
    }

    async findByDelivery(entregaId: string): Promise<EvidenciaEntrega[]> {
        return await this.evidenciaRepository.find({
            where: { entregaId },
            order: { createdAt: 'DESC' },
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
        const filePath = path.join(process.cwd(), evidencia.archivoUrl);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            this.logger.log(`Deleted file ${filePath}`);
        }

        await this.evidenciaRepository.remove(evidencia);
        this.logger.log(`Deleted evidence ${id}`);
    }
}

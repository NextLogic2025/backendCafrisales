import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IncidenciaEntrega } from './entities/incidencia-entrega.entity';
import { ReportIncidentDto } from './dto/report-incident.dto';
import { ResolveIncidentDto } from './dto/resolve-incident.dto';
import { OutboxService } from '../outbox/outbox.service';

@Injectable()
export class IncidentsService {
    private readonly logger = new Logger(IncidentsService.name);

    constructor(
        @InjectRepository(IncidenciaEntrega)
        private readonly incidenciaRepository: Repository<IncidenciaEntrega>,
        private readonly outboxService: OutboxService,
    ) { }

    async reportIncident(
        entregaId: string,
        reportDto: ReportIncidentDto,
        userId?: string,
    ): Promise<IncidenciaEntrega> {
        this.logger.log(`Reporting incident for delivery ${entregaId}: ${reportDto.tipo_incidencia}`);

        const incidencia = this.incidenciaRepository.create({
            entrega_id: entregaId,
            tipo_incidencia: reportDto.tipo_incidencia,
            severidad: reportDto.severidad,
            descripcion: reportDto.descripcion,
            reportado_por_id: userId,
            reportado_en: new Date(),
        });

        const saved = await this.incidenciaRepository.save(incidencia);

        await this.outboxService.createEvent(
            'IncidenciaReportada',
            { entrega_id: entregaId, incidencia_id: saved.id, severidad: saved.severidad },
            'delivery',
            saved.id,
        );

        return saved;
    }

    async findAll(): Promise<IncidenciaEntrega[]> {
        return await this.incidenciaRepository.find({
            order: { reportado_en: 'DESC' },
        });
    }

    async findByDelivery(entregaId: string): Promise<IncidenciaEntrega[]> {
        return await this.incidenciaRepository.find({
            where: { entrega_id: entregaId },
            order: { reportado_en: 'DESC' },
        });
    }

    async findUnresolved(severidad?: string[]): Promise<IncidenciaEntrega[]> {
        const where: any = { resuelto_en: null };
        if (severidad && severidad.length > 0) where.severidad = severidad as any;
        return await this.incidenciaRepository.find({
            where,
            order: { reportado_en: 'DESC' },
        });
    }

    async findOne(id: string): Promise<IncidenciaEntrega> {
        const incidencia = await this.incidenciaRepository.findOne({ where: { id } });
        if (!incidencia) {
            throw new NotFoundException(`Incident with ID ${id} not found`);
        }
        return incidencia;
    }

    async resolveIncident(
        id: string,
        resolveDto: ResolveIncidentDto,
        userId?: string,
    ): Promise<IncidenciaEntrega> {
        const incidencia = await this.findOne(id);

        if (incidencia.resuelto_en) {
            throw new BadRequestException('Incident is already resolved');
        }

        incidencia.resuelto_en = new Date();
        incidencia.resolucion = resolveDto.resolucion;
        incidencia.resuelto_por_id = userId;

        this.logger.log(`Resolved incident ${id}`);
        const saved = await this.incidenciaRepository.save(incidencia);

        await this.outboxService.createEvent(
            'IncidenciaResuelta',
            { entrega_id: saved.entrega_id, incidencia_id: saved.id },
            'delivery',
            saved.id,
        );

        return saved;
    }

    async remove(id: string): Promise<void> {
        const incidencia = await this.findOne(id);
        await this.incidenciaRepository.remove(incidencia);
        this.logger.log(`Deleted incident ${id}`);
    }
}

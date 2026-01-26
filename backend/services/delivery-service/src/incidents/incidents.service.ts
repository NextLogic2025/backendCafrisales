import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IncidenciaEntrega } from './entities/incidencia-entrega.entity';
import { ReportIncidentDto } from './dto/report-incident.dto';
import { ResolveIncidentDto } from './dto/resolve-incident.dto';

@Injectable()
export class IncidentsService {
    private readonly logger = new Logger(IncidentsService.name);

    constructor(
        @InjectRepository(IncidenciaEntrega)
        private readonly incidenciaRepository: Repository<IncidenciaEntrega>,
    ) { }

    async reportIncident(
        entregaId: string,
        reportDto: ReportIncidentDto,
        userId?: string,
    ): Promise<IncidenciaEntrega> {
        this.logger.log(`Reporting incident for delivery ${entregaId}: ${reportDto.titulo}`);

        const incidencia = this.incidenciaRepository.create({
            entregaId,
            ...reportDto,
            reportadoPorUserId: userId,
        });

        return await this.incidenciaRepository.save(incidencia);
    }

    async findAll(): Promise<IncidenciaEntrega[]> {
        return await this.incidenciaRepository.find({
            order: { createdAt: 'DESC' },
        });
    }

    async findByDelivery(entregaId: string): Promise<IncidenciaEntrega[]> {
        return await this.incidenciaRepository.find({
            where: { entregaId },
            order: { createdAt: 'DESC' },
        });
    }

    async findUnresolved(): Promise<IncidenciaEntrega[]> {
        return await this.incidenciaRepository.find({
            where: { resuelto: false },
            order: { severidad: 'DESC', createdAt: 'ASC' },
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

        if (incidencia.resuelto) {
            throw new BadRequestException('Incident is already resolved');
        }

        incidencia.resuelto = true;
        incidencia.fechaResolucion = new Date();
        incidencia.resolucionNotas = resolveDto.resolucionNotas;
        incidencia.resueltoPorUserId = userId;

        this.logger.log(`Resolved incident ${id}`);
        return await this.incidenciaRepository.save(incidencia);
    }

    async remove(id: string): Promise<void> {
        const incidencia = await this.findOne(id);
        await this.incidenciaRepository.remove(incidencia);
        this.logger.log(`Deleted incident ${id}`);
    }
}

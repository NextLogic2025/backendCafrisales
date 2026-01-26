import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Entrega } from './entities/entrega.entity';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';
import { EstadoEntrega } from '../common/constants/delivery-enums';
import { validateCoordinates } from '../common/utils/coordinate-validator';

@Injectable()
export class DeliveriesService {
    private readonly logger = new Logger(DeliveriesService.name);

    constructor(
        @InjectRepository(Entrega)
        private readonly entregaRepository: Repository<Entrega>,
    ) { }

    async create(createDeliveryDto: CreateDeliveryDto): Promise<Entrega> {
        this.logger.log(`Creating delivery for order ${createDeliveryDto.pedidoId}`);

        // Validate coordinates if provided
        validateCoordinates(createDeliveryDto.latitudEntrega, createDeliveryDto.longitudEntrega);

        const entrega = this.entregaRepository.create({
            ...createDeliveryDto,
            estado: EstadoEntrega.PENDIENTE,
            cantidadItemsEntregados: 0,
            fechaProgramada: createDeliveryDto.fechaProgramada
                ? new Date(createDeliveryDto.fechaProgramada)
                : null,
        });

        return await this.entregaRepository.save(entrega);
    }

    async findAll(): Promise<Entrega[]> {
        return await this.entregaRepository.find({
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string): Promise<Entrega> {
        const entrega = await this.entregaRepository.findOne({
            where: { id },
            relations: ['evidencias', 'incidencias'],
        });

        if (!entrega) {
            throw new NotFoundException(`Entrega with ID ${id} not found`);
        }

        return entrega;
    }

    async findByOrder(pedidoId: string): Promise<Entrega[]> {
        return await this.entregaRepository.find({
            where: { pedidoId },
            relations: ['evidencias', 'incidencias'],
            order: { createdAt: 'DESC' },
        });
    }

    async findByRoute(rutaLogisticaId: string): Promise<Entrega[]> {
        return await this.entregaRepository.find({
            where: { rutaLogisticaId },
            relations: ['evidencias', 'incidencias'],
            order: { fechaProgramada: 'ASC' },
        });
    }

    async findByDriver(conductorId: string): Promise<Entrega[]> {
        return await this.entregaRepository.find({
            where: { conductorId },
            order: { fechaProgramada: 'ASC' },
        });
    }

    async updateStatus(id: string, updateStatusDto: UpdateDeliveryStatusDto, userId?: string): Promise<Entrega> {
        const entrega = await this.findOne(id);

        // Validate coordinates if provided
        if (updateStatusDto.latitudEntrega !== undefined || updateStatusDto.longitudEntrega !== undefined) {
            validateCoordinates(updateStatusDto.latitudEntrega, updateStatusDto.longitudEntrega);
        }

        // Update fields
        Object.assign(entrega, {
            ...updateStatusDto,
            fechaEntregaReal: [
                EstadoEntrega.ENTREGADO_COMPLETO,
                EstadoEntrega.ENTREGADO_PARCIAL,
                EstadoEntrega.NO_ENTREGADO,
            ].includes(updateStatusDto.estado)
                ? new Date()
                : entrega.fechaEntregaReal,
        });

        this.logger.log(
            `Updated delivery ${id} status from ${entrega.estado} to ${updateStatusDto.estado}`,
        );

        return await this.entregaRepository.save(entrega);
    }

    async assignToRoute(id: string, rutaLogisticaId: string): Promise<Entrega> {
        const entrega = await this.findOne(id);

        if (entrega.estado !== EstadoEntrega.PENDIENTE) {
            throw new BadRequestException(
                `Cannot assign delivery in state ${entrega.estado} to a route`,
            );
        }

        entrega.rutaLogisticaId = rutaLogisticaId;
        return await this.entregaRepository.save(entrega);
    }

    async remove(id: string): Promise<void> {
        const entrega = await this.findOne(id);
        await this.entregaRepository.remove(entrega);
        this.logger.log(`Deleted delivery ${id}`);
    }
}

import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RuteroLogistico } from './entities/rutero-logistico.entity';
import { ParadaRuteroLogistico } from './entities/parada-rutero-logistico.entity';
import { CreateLogisticRouteDto, AddOrderDto } from './dto/logistics-route.dto';
import { EstadoRutero } from '../../common/constants/route-enums';

@Injectable()
export class LogisticsService {
    constructor(
        @InjectRepository(RuteroLogistico)
        private readonly routeRepo: Repository<RuteroLogistico>,
        @InjectRepository(ParadaRuteroLogistico)
        private readonly stopRepo: Repository<ParadaRuteroLogistico>,
    ) { }

    async create(dto: CreateLogisticRouteDto, supervisorId: string): Promise<RuteroLogistico> {
        const existing = await this.routeRepo.findOne({
            where: {
                fecha_rutero: new Date(dto.fecha_rutero),
                zona_id: dto.zona_id,
                vehiculo_id: dto.vehiculo_id,
            },
        });

        if (existing) {
            throw new ConflictException('Ya existe un rutero logístico para esta fecha, zona y vehículo');
        }

        const route = this.routeRepo.create({
            ...dto,
            creado_por_supervisor_id: supervisorId,
            estado: EstadoRutero.BORRADOR,
        });

        return this.routeRepo.save(route);
    }

    async addOrder(routeId: string, dto: AddOrderDto): Promise<ParadaRuteroLogistico> {
        const route = await this.findOne(routeId);

        if (route.estado !== EstadoRutero.BORRADOR) {
            throw new BadRequestException('Solo se pueden agregar pedidos a ruteros en borrador');
        }

        const stop = this.stopRepo.create({
            rutero_id: routeId,
            ...dto,
        });

        try {
            return await this.stopRepo.save(stop);
        } catch (error) {
            if (error.code === '23505') {
                throw new ConflictException('El pedido ya está en el rutero o el orden está duplicado');
            }
            throw error;
        }
    }

    async findOne(id: string): Promise<RuteroLogistico> {
        const route = await this.routeRepo.findOne({
            where: { id },
            relations: ['paradas'],
            order: { paradas: { orden_entrega: 'ASC' } },
        });

        if (!route) {
            throw new NotFoundException(`Rutero logístico ${id} no encontrado`);
        }

        return route;
    }

    async findAll(): Promise<RuteroLogistico[]> {
        return this.routeRepo.find({ order: { fecha_rutero: 'DESC' } });
    }

    async publish(id: string, userId: string): Promise<RuteroLogistico> {
        const route = await this.findOne(id);
        if (route.estado !== EstadoRutero.BORRADOR) {
            throw new BadRequestException('Solo se pueden publicar ruteros en borrador');
        }

        if (!route.paradas || route.paradas.length === 0) {
            throw new BadRequestException('No se puede publicar un rutero sin pedidos');
        }

        route.estado = EstadoRutero.PUBLICADO;
        route.publicado_en = new Date();
        route.publicado_por = userId;

        return this.routeRepo.save(route);
    }
}

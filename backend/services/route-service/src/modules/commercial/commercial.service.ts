import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { RuteroComercial } from './entities/rutero-comercial.entity';
import { ParadaRuteroComercial } from './entities/parada-rutero-comercial.entity';
import { CreateCommercialRouteDto, AddVisitDto, UpdateVisitResultDto } from './dto/commercial-route.dto';
import { EstadoRutero } from '../../common/constants/route-enums';

@Injectable()
export class CommercialService {
    constructor(
        @InjectRepository(RuteroComercial)
        private readonly routeRepo: Repository<RuteroComercial>,
        @InjectRepository(ParadaRuteroComercial)
        private readonly stopRepo: Repository<ParadaRuteroComercial>,
        private readonly dataSource: DataSource,
    ) { }

    async create(dto: CreateCommercialRouteDto, supervisorId: string): Promise<RuteroComercial> {
        const existing = await this.routeRepo.findOne({
            where: {
                fecha_rutero: new Date(dto.fecha_rutero),
                vendedor_id: dto.vendedor_id,
            },
        });

        if (existing) {
            throw new ConflictException('Ya existe un rutero para este vendedor en la fecha especificada');
        }

        const route = this.routeRepo.create({
            ...dto,
            creado_por_supervisor_id: supervisorId,
            estado: EstadoRutero.BORRADOR,
        });

        return this.routeRepo.save(route);
    }

    async addVisit(routeId: string, dto: AddVisitDto): Promise<ParadaRuteroComercial> {
        const route = await this.findOne(routeId);

        if (route.estado !== EstadoRutero.BORRADOR) {
            throw new BadRequestException('Solo se pueden agregar paradas a ruteros en borrador');
        }

        const stop = this.stopRepo.create({
            rutero_id: routeId,
            ...dto,
        });

        try {
            return await this.stopRepo.save(stop);
        } catch (error) {
            if (error.code === '23505') { // Unique violation
                throw new ConflictException('La visita ya existe o el orden está duplicado');
            }
            throw error;
        }
    }

    async findOne(id: string): Promise<RuteroComercial> {
        const route = await this.routeRepo.findOne({
            where: { id },
            relations: ['paradas'],
            order: { paradas: { orden_visita: 'ASC' } },
        });

        if (!route) {
            throw new NotFoundException(`Rutero ${id} no encontrado`);
        }

        return route;
    }

    async findAll(): Promise<RuteroComercial[]> {
        return this.routeRepo.find({
            order: { fecha_rutero: 'DESC' },
        });
    }

    async getBySeller(vendedorId: string): Promise<RuteroComercial[]> {
        return this.routeRepo.find({
            where: { vendedor_id: vendedorId },
            order: { fecha_rutero: 'DESC' },
        });
    }

    async publish(id: string, userId: string): Promise<RuteroComercial> {
        const route = await this.findOne(id);
        if (route.estado !== EstadoRutero.BORRADOR) {
            throw new BadRequestException('Solo se pueden publicar ruteros en borrador');
        }

        if (!route.paradas || route.paradas.length === 0) {
            throw new BadRequestException('No se puede publicar un rutero sin paradas');
        }

        route.estado = EstadoRutero.PUBLICADO;
        route.publicado_en = new Date();
        route.publicado_por = userId;

        return this.routeRepo.save(route);
    }

    async registerVisit(stopId: string, dto: UpdateVisitResultDto): Promise<ParadaRuteroComercial> {
        const stop = await this.stopRepo.findOne({ where: { id: stopId } });
        if (!stop) throw new NotFoundException('Visita no encontrada');

        stop.resultado = dto.resultado;
        stop.notas = dto.notas;
        stop.checkout_en = new Date(); // Simpler implementation: checkout = now

        // Logic to set checkin if null could go here, or handled by separate endpoint

        return this.stopRepo.save(stop);
    }
}

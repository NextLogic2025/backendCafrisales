import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { RuteroComercial } from './entities/rutero-comercial.entity';
import { ParadaRuteroComercial } from './entities/parada-rutero-comercial.entity';
import { CreateCommercialRouteDto, AddVisitDto, UpdateVisitResultDto } from './dto/commercial-route.dto';
import { EstadoRutero, TipoRutero } from '../../common/constants/route-enums';
import { HistorialEstadoRutero } from '../history/entities/historial-estado-rutero.entity';
import { OutboxService } from '../outbox/outbox.service';
import { UserExternalService } from '../../services/user-external.service';
import { ZoneExternalService } from '../../services/zone-external.service';

@Injectable()
export class CommercialService {
    constructor(
        @InjectRepository(RuteroComercial)
        private readonly routeRepo: Repository<RuteroComercial>,
        @InjectRepository(ParadaRuteroComercial)
        private readonly stopRepo: Repository<ParadaRuteroComercial>,
        private readonly dataSource: DataSource,
        private readonly outboxService: OutboxService,
        private readonly userExternalService: UserExternalService,
        private readonly zoneExternalService: ZoneExternalService,
    ) { }

    async create(dto: CreateCommercialRouteDto, supervisorId: string): Promise<RuteroComercial> {
        const zone = await this.zoneExternalService.getZoneById(dto.zona_id);
        if (!zone) {
            throw new BadRequestException('La zona especificada no es válida o no existe.');
        }

        const isSeller = await this.userExternalService.isSeller(dto.vendedor_id);
        if (!isSeller) {
            throw new BadRequestException('El vendedor asignado no es válido.');
        }

        const invalidClients: string[] = [];
        for (const parada of dto.paradas) {
            const client = await this.userExternalService.getClientById(parada.cliente_id);
            if (!client || (client.zona_id && client.zona_id !== dto.zona_id)) {
                invalidClients.push(parada.cliente_id);
            }
        }

        if (invalidClients.length > 0) {
            throw new BadRequestException(`Clientes inválidos o fuera de zona: ${invalidClients.join(', ')}`);
        }

        try {
            return await this.dataSource.transaction(async (manager) => {
                const routeRepo = manager.getRepository(RuteroComercial);
                const stopRepo = manager.getRepository(ParadaRuteroComercial);
                const historyRepo = manager.getRepository(HistorialEstadoRutero);

                const route = routeRepo.create({
                    fecha_rutero: new Date(dto.fecha_rutero),
                    zona_id: dto.zona_id,
                    vendedor_id: dto.vendedor_id,
                    creado_por_supervisor_id: supervisorId,
                    estado: EstadoRutero.BORRADOR,
                });

                const savedRoute = await routeRepo.save(route);

                const stops = dto.paradas.map((parada) =>
                    stopRepo.create({
                        rutero_id: savedRoute.id,
                        cliente_id: parada.cliente_id,
                        orden_visita: parada.orden_visita,
                        objetivo: parada.objetivo,
                    }),
                );
                await stopRepo.save(stops);

                await historyRepo.save({
                    tipo: TipoRutero.COMERCIAL,
                    rutero_id: savedRoute.id,
                    estado: EstadoRutero.BORRADOR,
                    cambiado_por_id: supervisorId,
                    motivo: 'Rutero comercial creado',
                });

                await this.outboxService.createEvent(
                    'RuteroComercialCreado',
                    {
                        rutero_id: savedRoute.id,
                        fecha_rutero: savedRoute.fecha_rutero,
                        zona_id: savedRoute.zona_id,
                        vendedor_id: savedRoute.vendedor_id,
                        paradas_count: stops.length,
                    },
                    'route',
                    savedRoute.id,
                    manager,
                );

                return savedRoute;
            });
        } catch (error: any) {
            if (error?.code === '23505') {
                throw new ConflictException('Ya existe un rutero para este vendedor en la fecha especificada');
            }
            throw error;
        }
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
        } catch (error: any) {
            if (error.code === '23505') {
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

    async getBySeller(vendedorId: string, fechaDesde?: string): Promise<RuteroComercial[]> {
        const qb = this.routeRepo
            .createQueryBuilder('r')
            .where('r.vendedor_id = :vendedorId', { vendedorId })
            .orderBy('r.fecha_rutero', 'DESC');

        if (fechaDesde) {
            qb.andWhere('r.fecha_rutero >= :fechaDesde', { fechaDesde });
        }

        return qb.getMany();
    }

    async publish(id: string, userId: string): Promise<RuteroComercial> {
        return this.dataSource.transaction(async (manager) => {
            const routeRepo = manager.getRepository(RuteroComercial);
            const historyRepo = manager.getRepository(HistorialEstadoRutero);

            const route = await routeRepo.findOne({
                where: { id },
                relations: ['paradas'],
                lock: { mode: 'pessimistic_write' },
            });
            if (!route) {
                throw new NotFoundException(`Rutero ${id} no encontrado`);
            }
            if (route.estado !== EstadoRutero.BORRADOR) {
                throw new BadRequestException('Solo se pueden publicar ruteros en borrador');
            }
            if (!route.paradas || route.paradas.length === 0) {
                throw new BadRequestException('No se puede publicar un rutero sin paradas');
            }

            route.estado = EstadoRutero.PUBLICADO;
            route.publicado_en = new Date();
            route.publicado_por = userId;

            const saved = await routeRepo.save(route);

            await historyRepo.save({
                tipo: TipoRutero.COMERCIAL,
                rutero_id: id,
                estado: EstadoRutero.PUBLICADO,
                cambiado_por_id: userId,
                motivo: 'Rutero publicado para ejecución',
            });

            await this.outboxService.createEvent(
                'RuteroComercialPublicado',
                { rutero_id: id, fecha_rutero: route.fecha_rutero },
                'route',
                id,
                manager,
            );

            return saved;
        });
    }

    async start(id: string, vendedorId: string): Promise<RuteroComercial> {
        return this.dataSource.transaction(async (manager) => {
            const routeRepo = manager.getRepository(RuteroComercial);
            const historyRepo = manager.getRepository(HistorialEstadoRutero);

            const route = await routeRepo.findOne({
                where: { id },
                lock: { mode: 'pessimistic_write' },
            });
            if (!route) {
                throw new NotFoundException(`Rutero ${id} no encontrado`);
            }
            if (route.vendedor_id !== vendedorId) {
                throw new ForbiddenException('No autorizado para iniciar este rutero');
            }
            if (route.estado !== EstadoRutero.PUBLICADO) {
                throw new BadRequestException('Solo se pueden iniciar ruteros publicados');
            }

            route.estado = EstadoRutero.EN_CURSO;
            route.iniciado_en = new Date();
            route.iniciado_por = vendedorId;

            const saved = await routeRepo.save(route);

            await historyRepo.save({
                tipo: TipoRutero.COMERCIAL,
                rutero_id: id,
                estado: EstadoRutero.EN_CURSO,
                cambiado_por_id: vendedorId,
                motivo: 'Vendedor inició rutero',
            });

            await this.outboxService.createEvent(
                'RuteroComercialIniciado',
                { rutero_id: id, fecha_rutero: route.fecha_rutero },
                'route',
                id,
                manager,
            );

            return saved;
        });
    }

    async complete(id: string, vendedorId: string): Promise<RuteroComercial> {
        return this.dataSource.transaction(async (manager) => {
            const routeRepo = manager.getRepository(RuteroComercial);
            const stopRepo = manager.getRepository(ParadaRuteroComercial);
            const historyRepo = manager.getRepository(HistorialEstadoRutero);

            const route = await routeRepo.findOne({
                where: { id },
                lock: { mode: 'pessimistic_write' },
            });
            if (!route) {
                throw new NotFoundException(`Rutero ${id} no encontrado`);
            }
            if (route.vendedor_id !== vendedorId) {
                throw new ForbiddenException('No autorizado para completar este rutero');
            }
            if (route.estado !== EstadoRutero.EN_CURSO) {
                throw new BadRequestException('Solo se pueden completar ruteros en curso');
            }

            const pendingStops = await stopRepo.count({
                where: { rutero_id: id, checkout_en: null as any },
            });
            if (pendingStops > 0) {
                throw new BadRequestException('No se puede completar el rutero con paradas pendientes');
            }

            route.estado = EstadoRutero.COMPLETADO;
            route.completado_en = new Date();
            route.completado_por = vendedorId;

            const saved = await routeRepo.save(route);

            await historyRepo.save({
                tipo: TipoRutero.COMERCIAL,
                rutero_id: id,
                estado: EstadoRutero.COMPLETADO,
                cambiado_por_id: vendedorId,
                motivo: 'Todas las visitas completadas',
            });

            await this.outboxService.createEvent(
                'RuteroComercialCompletado',
                { rutero_id: id, fecha_rutero: route.fecha_rutero },
                'route',
                id,
                manager,
            );

            return saved;
        });
    }

    async cancel(id: string, supervisorId: string, motivo?: string): Promise<RuteroComercial> {
        return this.dataSource.transaction(async (manager) => {
            const routeRepo = manager.getRepository(RuteroComercial);
            const historyRepo = manager.getRepository(HistorialEstadoRutero);

            const route = await routeRepo.findOne({
                where: { id },
                lock: { mode: 'pessimistic_write' },
            });
            if (!route) {
                throw new NotFoundException(`Rutero ${id} no encontrado`);
            }
            if (route.estado === EstadoRutero.COMPLETADO || route.estado === EstadoRutero.CANCELADO) {
                throw new BadRequestException('El rutero no puede ser cancelado');
            }

            route.estado = EstadoRutero.CANCELADO;
            route.cancelado_en = new Date();
            route.cancelado_por = supervisorId;
            route.cancelado_motivo = motivo || null;

            const saved = await routeRepo.save(route);

            await historyRepo.save({
                tipo: TipoRutero.COMERCIAL,
                rutero_id: id,
                estado: EstadoRutero.CANCELADO,
                cambiado_por_id: supervisorId,
                motivo: motivo || 'Rutero cancelado',
            });

            await this.outboxService.createEvent(
                'RuteroComercialCancelado',
                { rutero_id: id, fecha_rutero: route.fecha_rutero },
                'route',
                id,
                manager,
            );

            return saved;
        });
    }

    async checkin(stopId: string, vendedorId: string): Promise<ParadaRuteroComercial> {
        const stop = await this.stopRepo.findOne({
            where: { id: stopId },
            relations: ['rutero'],
        });
        if (!stop) throw new NotFoundException('Visita no encontrada');
        if (!stop.rutero) throw new NotFoundException('Rutero no encontrado');
        if (stop.rutero.estado !== EstadoRutero.EN_CURSO) {
            throw new BadRequestException('El rutero no está en curso');
        }
        if (stop.rutero.vendedor_id !== vendedorId) {
            throw new ForbiddenException('No autorizado para registrar check-in');
        }

        if (!stop.checkin_en) {
            stop.checkin_en = new Date();
        }

        return this.stopRepo.save(stop);
    }

    async checkout(stopId: string, vendedorId: string, dto: UpdateVisitResultDto): Promise<ParadaRuteroComercial> {
        const stop = await this.stopRepo.findOne({
            where: { id: stopId },
            relations: ['rutero'],
        });
        if (!stop) throw new NotFoundException('Visita no encontrada');
        if (!stop.rutero) throw new NotFoundException('Rutero no encontrado');
        if (stop.rutero.estado !== EstadoRutero.EN_CURSO) {
            throw new BadRequestException('El rutero no está en curso');
        }
        if (stop.rutero.vendedor_id !== vendedorId) {
            throw new ForbiddenException('No autorizado para registrar check-out');
        }
        if (!stop.checkin_en) {
            throw new BadRequestException('No se puede hacer check-out sin check-in');
        }

        stop.checkout_en = new Date();
        stop.resultado = dto.resultado;
        stop.notas = dto.notas;

        return this.stopRepo.save(stop);
    }
}

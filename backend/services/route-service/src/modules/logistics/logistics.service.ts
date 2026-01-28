import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { RuteroLogistico } from './entities/rutero-logistico.entity';
import { ParadaRuteroLogistico } from './entities/parada-rutero-logistico.entity';
import { CreateLogisticRouteDto, AddOrderDto } from './dto/logistics-route.dto';
import { EstadoRutero, EstadoVehiculo, TipoRutero } from '../../common/constants/route-enums';
import { HistorialEstadoRutero } from '../history/entities/historial-estado-rutero.entity';
import { OutboxService } from '../outbox/outbox.service';
import { UserExternalService } from '../../services/user-external.service';
import { ZoneExternalService } from '../../services/zone-external.service';
import { OrderExternalService } from '../../services/order-external.service';
import { Vehiculo } from '../fleet/entities/vehiculo.entity';

@Injectable()
export class LogisticsService {
    constructor(
        @InjectRepository(RuteroLogistico)
        private readonly routeRepo: Repository<RuteroLogistico>,
        @InjectRepository(ParadaRuteroLogistico)
        private readonly stopRepo: Repository<ParadaRuteroLogistico>,
    @InjectRepository(Vehiculo)
    private readonly vehicleRepo: Repository<Vehiculo>,
    @InjectRepository(HistorialEstadoRutero)
    private readonly historyRepo: Repository<HistorialEstadoRutero>,
    private readonly dataSource: DataSource,
        private readonly outboxService: OutboxService,
        private readonly userExternalService: UserExternalService,
        private readonly zoneExternalService: ZoneExternalService,
        private readonly orderExternalService: OrderExternalService,
    ) { }

    async create(dto: CreateLogisticRouteDto, supervisorId: string): Promise<RuteroLogistico> {
        const zone = await this.zoneExternalService.getZoneById(dto.zona_id);
        if (!zone) {
            throw new BadRequestException('La zona especificada no es válida o no existe.');
        }

        const vehicle = await this.vehicleRepo.findOne({ where: { id: dto.vehiculo_id } });
        if (!vehicle) {
            throw new BadRequestException('El vehículo especificado no es válido o no existe.');
        }
        if (vehicle.estado !== EstadoVehiculo.DISPONIBLE) {
            throw new BadRequestException('El vehículo no está disponible.');
        }

        const isTransporter = await this.userExternalService.isTransporter(dto.transportista_id);
        if (!isTransporter) {
            throw new BadRequestException('El transportista asignado no es válido.');
        }

        const invalidOrders: string[] = [];
        for (const parada of dto.paradas) {
            const order = await this.orderExternalService.getOrderById(parada.pedido_id);
            if (!order) {
                invalidOrders.push(parada.pedido_id);
                continue;
            }
            if (!['validado', 'aceptado_cliente'].includes(order.estado)) {
                invalidOrders.push(parada.pedido_id);
                continue;
            }
            if (order.zona_id && order.zona_id !== dto.zona_id) {
                invalidOrders.push(parada.pedido_id);
            }
        }

        if (invalidOrders.length > 0) {
            throw new BadRequestException(`Pedidos inválidos o fuera de zona: ${invalidOrders.join(', ')}`);
        }

        try {
            return await this.dataSource.transaction(async (manager) => {
                const routeRepo = manager.getRepository(RuteroLogistico);
                const stopRepo = manager.getRepository(ParadaRuteroLogistico);
                const historyRepo = manager.getRepository(HistorialEstadoRutero);

                const route = routeRepo.create({
                    fecha_rutero: new Date(dto.fecha_rutero),
                    zona_id: dto.zona_id,
                    vehiculo_id: dto.vehiculo_id,
                    transportista_id: dto.transportista_id,
                    creado_por_supervisor_id: supervisorId,
                    estado: EstadoRutero.BORRADOR,
                });

                const savedRoute = await routeRepo.save(route);

                const stops = dto.paradas.map((parada) =>
                    stopRepo.create({
                        rutero_id: savedRoute.id,
                        pedido_id: parada.pedido_id,
                        orden_entrega: parada.orden_entrega,
                    }),
                );
                await stopRepo.save(stops);

                await historyRepo.save({
                    tipo: TipoRutero.LOGISTICO,
                    rutero_id: savedRoute.id,
                    estado: EstadoRutero.BORRADOR,
                    cambiado_por_id: supervisorId,
                    motivo: 'Rutero logístico creado',
                });

                await this.outboxService.createEvent(
                    'RuteroLogisticoCreado',
                    {
                        rutero_id: savedRoute.id,
                        fecha_rutero: savedRoute.fecha_rutero,
                        zona_id: savedRoute.zona_id,
                        vehiculo_id: savedRoute.vehiculo_id,
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
                throw new ConflictException('Ya existe un rutero logístico para esta fecha, zona y vehículo');
            }
            throw error;
        }
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
        } catch (error: any) {
            if (error.code === '23505') {
                throw new ConflictException('El pedido ya está en el rutero o el orden está duplicado');
            }
            throw error;
        }
    }

    async removeOrder(routeId: string, pedidoId: string): Promise<{ removed: boolean }> {
        const route = await this.routeRepo.findOne({ where: { id: routeId } });
        if (!route) {
            throw new NotFoundException(`Rutero logÃ­stico ${routeId} no encontrado`);
        }
        if (route.estado !== EstadoRutero.BORRADOR) {
            throw new BadRequestException('Solo se pueden quitar pedidos de ruteros en borrador');
        }

        const stop = await this.stopRepo.findOne({ where: { rutero_id: routeId, pedido_id: pedidoId } });
        if (!stop) {
            throw new NotFoundException('El pedido no estÃ¡ en este rutero');
        }

        await this.stopRepo.remove(stop);

        const remaining = await this.stopRepo.find({
            where: { rutero_id: routeId },
            order: { orden_entrega: 'ASC' },
        });
        const updated = remaining.map((item, index) => ({
            ...item,
            orden_entrega: index + 1,
        }));
        await this.stopRepo.save(updated);

        return { removed: true };
    }

    async updateVehicle(routeId: string, dto: { vehiculo_id: string }, supervisorId: string): Promise<RuteroLogistico> {
        const route = await this.routeRepo.findOne({ where: { id: routeId } });
        if (!route) {
            throw new NotFoundException(`Rutero logÃ­stico ${routeId} no encontrado`);
        }
        if (route.estado !== EstadoRutero.BORRADOR) {
            throw new BadRequestException('Solo se puede cambiar el vehÃ­culo en ruteros borrador');
        }

        const vehicle = await this.vehicleRepo.findOne({ where: { id: dto.vehiculo_id } });
        if (!vehicle) {
            throw new BadRequestException('El vehÃ­culo especificado no es vÃ¡lido o no existe.');
        }
        if (vehicle.estado !== EstadoVehiculo.DISPONIBLE) {
            throw new BadRequestException('El vehÃ­culo no estÃ¡ disponible.');
        }

        route.vehiculo_id = dto.vehiculo_id;
        const saved = await this.routeRepo.save(route);

        await this.historyRepo.save({
            tipo: TipoRutero.LOGISTICO,
            rutero_id: routeId,
            estado: route.estado,
            cambiado_por_id: supervisorId,
            motivo: 'VehÃ­culo actualizado',
        });

        return saved;
    }

    async getHistory(routeId: string): Promise<HistorialEstadoRutero[]> {
        const route = await this.routeRepo.findOne({ where: { id: routeId } });
        if (!route) {
            throw new NotFoundException(`Rutero logÃ­stico ${routeId} no encontrado`);
        }
        return this.historyRepo.find({
            where: { tipo: TipoRutero.LOGISTICO, rutero_id: routeId },
            order: { creado_en: 'DESC' },
        });
    }

    async findOne(id: string): Promise<any> {
        const route = await this.routeRepo.findOne({
            where: { id },
            relations: ['paradas'],
            order: { paradas: { orden_entrega: 'ASC' } },
        });

        if (!route) {
            throw new NotFoundException(`Rutero logístico ${id} no encontrado`);
        }

        const vehicle = await this.vehicleRepo.findOne({ where: { id: route.vehiculo_id } });

        return {
            ...route,
            vehiculo: vehicle || null,
        };
    }

    async findAll(transportistaId?: string, estados?: string[]): Promise<RuteroLogistico[]> {
        const qb = this.routeRepo.createQueryBuilder('r').orderBy('r.fecha_rutero', 'DESC');
        if (transportistaId) {
            qb.where('r.transportista_id = :transportistaId', { transportistaId });
        }
        if (estados && estados.length > 0) {
            qb.andWhere('r.estado IN (:...estados)', { estados });
        }
        return qb.getMany();
    }

    async publish(id: string, userId: string): Promise<RuteroLogistico> {
        return this.dataSource.transaction(async (manager) => {
            const routeRepo = manager.getRepository(RuteroLogistico);
            const stopRepo = manager.getRepository(ParadaRuteroLogistico);
            const historyRepo = manager.getRepository(HistorialEstadoRutero);
            const vehicleRepo = manager.getRepository(Vehiculo);

            const route = await routeRepo.findOne({
                where: { id },
                lock: { mode: 'pessimistic_write' },
            });
            if (!route) {
                throw new NotFoundException(`Rutero logístico ${id} no encontrado`);
            }
            if (route.estado !== EstadoRutero.BORRADOR) {
                throw new BadRequestException('Solo se pueden publicar ruteros en borrador');
            }
            const paradas = await stopRepo.find({ where: { rutero_id: id } });
            if (!paradas || paradas.length === 0) {
                throw new BadRequestException('No se puede publicar un rutero sin pedidos');
            }

            const vehicle = await vehicleRepo.findOne({ where: { id: route.vehiculo_id }, lock: { mode: 'pessimistic_write' } });
            if (!vehicle) {
                throw new BadRequestException('El vehículo especificado no es válido o no existe.');
            }
            if (vehicle.estado !== EstadoVehiculo.DISPONIBLE) {
                throw new BadRequestException('El vehículo no está disponible.');
            }

            route.estado = EstadoRutero.PUBLICADO;
            route.publicado_en = new Date();
            route.publicado_por = userId;

            vehicle.estado = EstadoVehiculo.ASIGNADO;

            const saved = await routeRepo.save(route);
            await vehicleRepo.save(vehicle);

            await historyRepo.save({
                tipo: TipoRutero.LOGISTICO,
                rutero_id: id,
                estado: EstadoRutero.PUBLICADO,
                cambiado_por_id: userId,
                motivo: 'Rutero logístico publicado',
            });

            await this.outboxService.createEvent(
                'RuteroLogisticoPublicado',
                { rutero_id: id, fecha_rutero: route.fecha_rutero, vehiculo_id: route.vehiculo_id },
                'route',
                id,
                manager,
            );

            return saved;
        });
    }

    async start(id: string, transportistaId: string): Promise<RuteroLogistico> {
        return this.dataSource.transaction(async (manager) => {
            const routeRepo = manager.getRepository(RuteroLogistico);
            const stopRepo = manager.getRepository(ParadaRuteroLogistico);
            const historyRepo = manager.getRepository(HistorialEstadoRutero);

            const route = await routeRepo.findOne({
                where: { id },
                lock: { mode: 'pessimistic_write' },
            });
            if (!route) {
                throw new NotFoundException(`Rutero logístico ${id} no encontrado`);
            }
            if (route.transportista_id !== transportistaId) {
                throw new ForbiddenException('No autorizado para iniciar este rutero');
            }
            if (route.estado !== EstadoRutero.PUBLICADO) {
                throw new BadRequestException('Solo se pueden iniciar ruteros publicados');
            }

            route.estado = EstadoRutero.EN_CURSO;
            route.iniciado_en = new Date();
            route.iniciado_por = transportistaId;

            const saved = await routeRepo.save(route);

            const paradas = await stopRepo.find({ where: { rutero_id: id } });

            await historyRepo.save({
                tipo: TipoRutero.LOGISTICO,
                rutero_id: id,
                estado: EstadoRutero.EN_CURSO,
                cambiado_por_id: transportistaId,
                motivo: 'Transportista inició rutero',
            });

            await this.outboxService.createEvent(
                'RuteroLogisticoIniciado',
                {
                    rutero_id: id,
                    fecha_rutero: route.fecha_rutero,
                    pedidos: (paradas || []).map((p) => p.pedido_id),
                },
                'route',
                id,
                manager,
            );

            return saved;
        });
    }

    async complete(id: string, transportistaId: string): Promise<RuteroLogistico> {
        return this.dataSource.transaction(async (manager) => {
            const routeRepo = manager.getRepository(RuteroLogistico);
            const historyRepo = manager.getRepository(HistorialEstadoRutero);
            const vehicleRepo = manager.getRepository(Vehiculo);

            const route = await routeRepo.findOne({
                where: { id },
                lock: { mode: 'pessimistic_write' },
            });
            if (!route) {
                throw new NotFoundException(`Rutero logístico ${id} no encontrado`);
            }
            if (route.transportista_id !== transportistaId) {
                throw new ForbiddenException('No autorizado para completar este rutero');
            }
            if (route.estado !== EstadoRutero.EN_CURSO) {
                throw new BadRequestException('Solo se pueden completar ruteros en curso');
            }

            route.estado = EstadoRutero.COMPLETADO;
            route.completado_en = new Date();
            route.completado_por = transportistaId;

            const saved = await routeRepo.save(route);

            const vehicle = await vehicleRepo.findOne({ where: { id: route.vehiculo_id } });
            if (vehicle) {
                vehicle.estado = EstadoVehiculo.DISPONIBLE;
                await vehicleRepo.save(vehicle);
            }

            await historyRepo.save({
                tipo: TipoRutero.LOGISTICO,
                rutero_id: id,
                estado: EstadoRutero.COMPLETADO,
                cambiado_por_id: transportistaId,
                motivo: 'Rutero completado',
            });

            await this.outboxService.createEvent(
                'RuteroLogisticoCompletado',
                { rutero_id: id, fecha_rutero: route.fecha_rutero },
                'route',
                id,
                manager,
            );

            return saved;
        });
    }

    async cancel(id: string, supervisorId: string, motivo?: string): Promise<RuteroLogistico> {
        return this.dataSource.transaction(async (manager) => {
            const routeRepo = manager.getRepository(RuteroLogistico);
            const historyRepo = manager.getRepository(HistorialEstadoRutero);
            const vehicleRepo = manager.getRepository(Vehiculo);

            const route = await routeRepo.findOne({
                where: { id },
                lock: { mode: 'pessimistic_write' },
            });
            if (!route) {
                throw new NotFoundException(`Rutero logístico ${id} no encontrado`);
            }
            if (route.estado === EstadoRutero.COMPLETADO || route.estado === EstadoRutero.CANCELADO) {
                throw new BadRequestException('El rutero no puede ser cancelado');
            }

            const previousEstado = route.estado;

            route.estado = EstadoRutero.CANCELADO;
            route.cancelado_en = new Date();
            route.cancelado_por = supervisorId;
            route.cancelado_motivo = motivo || null;

            const saved = await routeRepo.save(route);

            if ([EstadoRutero.PUBLICADO, EstadoRutero.EN_CURSO].includes(previousEstado)) {
                const vehicle = await vehicleRepo.findOne({ where: { id: route.vehiculo_id } });
                if (vehicle) {
                    vehicle.estado = EstadoVehiculo.DISPONIBLE;
                    await vehicleRepo.save(vehicle);
                }
            }

            await historyRepo.save({
                tipo: TipoRutero.LOGISTICO,
                rutero_id: id,
                estado: EstadoRutero.CANCELADO,
                cambiado_por_id: supervisorId,
                motivo: motivo || 'Rutero cancelado',
            });

            await this.outboxService.createEvent(
                'RuteroLogisticoCancelado',
                { rutero_id: id, fecha_rutero: route.fecha_rutero },
                'route',
                id,
                manager,
            );

            return saved;
        });
    }
}

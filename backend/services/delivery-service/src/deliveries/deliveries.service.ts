import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Entrega } from './entities/entrega.entity';
import {
    CancelDeliveryDto,
    CompleteDeliveryDto,
    CompletePartialDeliveryDto,
    CreateDeliveriesBatchDto,
    EvidenceInputDto,
    NoDeliveryDto,
} from './dto/create-delivery.dto';
import { EstadoEntrega } from '../common/constants/delivery-enums';
import { validateCoordinates } from '../common/utils/coordinate-validator';
import { EvidenciaEntrega } from '../evidence/entities/evidencia-entrega.entity';
import { HistorialEstadoEntrega } from '../history/entities/historial-estado-entrega.entity';
import { OutboxService } from '../outbox/outbox.service';
import { OrderExternalService } from '../services/order-external.service';

@Injectable()
export class DeliveriesService {
    private readonly logger = new Logger(DeliveriesService.name);

    constructor(
        @InjectRepository(Entrega)
        private readonly entregaRepository: Repository<Entrega>,
        @InjectRepository(EvidenciaEntrega)
        private readonly evidenciaRepository: Repository<EvidenciaEntrega>,
        @InjectRepository(HistorialEstadoEntrega)
        private readonly historyRepository: Repository<HistorialEstadoEntrega>,
        private readonly outboxService: OutboxService,
        private readonly orderExternalService: OrderExternalService,
        private readonly dataSource: DataSource,
    ) { }

    async createBatch(dto: CreateDeliveriesBatchDto, actorId?: string) {
        return this.dataSource.transaction(async (manager) => {
            const entregaRepo = manager.getRepository(Entrega);
            const historyRepo = manager.getRepository(HistorialEstadoEntrega);

            const created: Entrega[] = [];
            for (const parada of dto.paradas) {
                const entrega = entregaRepo.create({
                    pedido_id: parada.pedido_id,
                    rutero_logistico_id: dto.rutero_logistico_id,
                    transportista_id: dto.transportista_id,
                    estado: EstadoEntrega.PENDIENTE,
                    asignado_en: new Date(),
                    creado_por: actorId || dto.transportista_id,
                    actualizado_por: actorId || dto.transportista_id,
                });
                const saved = await entregaRepo.save(entrega);
                created.push(saved);

                await historyRepo.save({
                    entrega_id: saved.id,
                    estado: EstadoEntrega.PENDIENTE,
                    cambiado_por_id: dto.transportista_id,
                    motivo: 'Entrega asignada a rutero',
                });
            }

            await this.outboxService.createEvent(
                'EntregasCreadas',
                {
                    rutero_logistico_id: dto.rutero_logistico_id,
                    transportista_id: dto.transportista_id,
                    entregas_creadas: created.length,
                },
                'delivery',
                dto.rutero_logistico_id,
                manager,
            );

            return { entregas_creadas: created.length };
        });
    }

    async markEnRuta(id: string, transportistaId: string) {
        return this.dataSource.transaction(async (manager) => {
            const entregaRepo = manager.getRepository(Entrega);
            const historyRepo = manager.getRepository(HistorialEstadoEntrega);

            const entrega = await entregaRepo.findOne({
                where: { id },
                lock: { mode: 'pessimistic_write' },
            });
            if (!entrega) throw new NotFoundException(`Entrega ${id} no encontrada`);
            if (entrega.transportista_id !== transportistaId) {
                throw new ForbiddenException('No autorizado para esta entrega');
            }
            if (entrega.estado !== EstadoEntrega.PENDIENTE) {
                throw new BadRequestException('La entrega no está en estado pendiente');
            }

            entrega.estado = EstadoEntrega.EN_RUTA;
            entrega.salida_ruta_en = new Date();
            entrega.actualizado_por = transportistaId;
            const saved = await entregaRepo.save(entrega);

            await historyRepo.save({
                entrega_id: id,
                estado: EstadoEntrega.EN_RUTA,
                cambiado_por_id: transportistaId,
                motivo: 'Transportista en camino',
            });

            await this.outboxService.createEvent(
                'EntregaEnRuta',
                { entrega_id: id, pedido_id: entrega.pedido_id },
                'delivery',
                id,
                manager,
            );

            return saved;
        });
    }

    async completeDelivery(id: string, dto: CompleteDeliveryDto, transportistaId: string) {
        const saved = await this.dataSource.transaction(async (manager) => {
            const entregaRepo = manager.getRepository(Entrega);
            const historyRepo = manager.getRepository(HistorialEstadoEntrega);
            const evidenciaRepo = manager.getRepository(EvidenciaEntrega);

            const entrega = await entregaRepo.findOne({
                where: { id },
                lock: { mode: 'pessimistic_write' },
            });
            if (!entrega) throw new NotFoundException(`Entrega ${id} no encontrada`);
            if (entrega.transportista_id !== transportistaId) {
                throw new ForbiddenException('No autorizado para esta entrega');
            }
            if (entrega.estado !== EstadoEntrega.EN_RUTA) {
                throw new BadRequestException('La entrega no está en ruta');
            }

            validateCoordinates(dto.latitud, dto.longitud);

            entrega.estado = EstadoEntrega.ENTREGADO_COMPLETO;
            entrega.entregado_en = new Date();
            entrega.latitud = dto.latitud;
            entrega.longitud = dto.longitud;
            entrega.observaciones = dto.observaciones;
            entrega.actualizado_por = transportistaId;

            const saved = await entregaRepo.save(entrega);

            if (dto.evidencias && dto.evidencias.length > 0) {
                const evidencias = dto.evidencias.map((e) =>
                    evidenciaRepo.create({
                        entrega_id: saved.id,
                        tipo: e.tipo as any,
                        url: e.url,
                        mime_type: e.mime_type,
                        hash_archivo: e.hash_archivo,
                        tamano_bytes: e.tamano_bytes,
                        descripcion: e.descripcion,
                        meta: e.meta || {},
                        creado_por: transportistaId,
                    }),
                );
                await evidenciaRepo.save(evidencias);
            }

            await historyRepo.save({
                entrega_id: id,
                estado: EstadoEntrega.ENTREGADO_COMPLETO,
                cambiado_por_id: transportistaId,
                motivo: 'Entrega completada con evidencias',
            });

            await this.outboxService.createEvent(
                'EntregaCompletada',
                { entrega_id: id, pedido_id: entrega.pedido_id },
                'delivery',
                id,
                manager,
            );

            return saved;
        });

        const updated = await this.orderExternalService.updateOrderStatus(saved.pedido_id, 'entregado', transportistaId);
        if (!updated) {
            this.logger.warn(`Order ${saved.pedido_id} was not updated to entregado`);
        }
        return saved;
    }

    async completePartialDelivery(id: string, dto: CompletePartialDeliveryDto, transportistaId: string) {
        return this.dataSource.transaction(async (manager) => {
            const entregaRepo = manager.getRepository(Entrega);
            const historyRepo = manager.getRepository(HistorialEstadoEntrega);
            const evidenciaRepo = manager.getRepository(EvidenciaEntrega);

            const entrega = await entregaRepo.findOne({
                where: { id },
                lock: { mode: 'pessimistic_write' },
            });
            if (!entrega) throw new NotFoundException(`Entrega ${id} no encontrada`);
            if (entrega.transportista_id !== transportistaId) {
                throw new ForbiddenException('No autorizado para esta entrega');
            }
            if (entrega.estado !== EstadoEntrega.EN_RUTA) {
                throw new BadRequestException('La entrega no está en ruta');
            }

            validateCoordinates(dto.latitud, dto.longitud);

            entrega.estado = EstadoEntrega.ENTREGADO_PARCIAL;
            entrega.entregado_en = new Date();
            entrega.latitud = dto.latitud;
            entrega.longitud = dto.longitud;
            entrega.observaciones = dto.motivo_parcial;
            entrega.actualizado_por = transportistaId;

            const saved = await entregaRepo.save(entrega);

            if (dto.evidencias && dto.evidencias.length > 0) {
                const evidencias = dto.evidencias.map((e) =>
                    evidenciaRepo.create({
                        entrega_id: saved.id,
                        tipo: e.tipo as any,
                        url: e.url,
                        mime_type: e.mime_type,
                        hash_archivo: e.hash_archivo,
                        tamano_bytes: e.tamano_bytes,
                        descripcion: e.descripcion,
                        meta: e.meta || {},
                        creado_por: transportistaId,
                    }),
                );
                await evidenciaRepo.save(evidencias);
            }

            await historyRepo.save({
                entrega_id: id,
                estado: EstadoEntrega.ENTREGADO_PARCIAL,
                cambiado_por_id: transportistaId,
                motivo: dto.motivo_parcial,
            });

            await this.outboxService.createEvent(
                'EntregaParcial',
                { entrega_id: id, pedido_id: entrega.pedido_id },
                'delivery',
                id,
                manager,
            );

            return saved;
        });
    }

    async markNoDelivery(id: string, dto: NoDeliveryDto, transportistaId: string) {
        return this.dataSource.transaction(async (manager) => {
            const entregaRepo = manager.getRepository(Entrega);
            const historyRepo = manager.getRepository(HistorialEstadoEntrega);
            const evidenciaRepo = manager.getRepository(EvidenciaEntrega);

            const entrega = await entregaRepo.findOne({
                where: { id },
                lock: { mode: 'pessimistic_write' },
            });
            if (!entrega) throw new NotFoundException(`Entrega ${id} no encontrada`);
            if (entrega.transportista_id !== transportistaId) {
                throw new ForbiddenException('No autorizado para esta entrega');
            }
            if (entrega.estado !== EstadoEntrega.EN_RUTA) {
                throw new BadRequestException('La entrega no está en ruta');
            }

            validateCoordinates(dto.latitud, dto.longitud);

            entrega.estado = EstadoEntrega.NO_ENTREGADO;
            entrega.motivo_no_entrega = dto.motivo_no_entrega;
            entrega.latitud = dto.latitud;
            entrega.longitud = dto.longitud;
            entrega.observaciones = dto.observaciones;
            entrega.actualizado_por = transportistaId;

            const saved = await entregaRepo.save(entrega);

            if (dto.evidencias && dto.evidencias.length > 0) {
                const evidencias = dto.evidencias.map((e) =>
                    evidenciaRepo.create({
                        entrega_id: saved.id,
                        tipo: e.tipo as any,
                        url: e.url,
                        mime_type: e.mime_type,
                        hash_archivo: e.hash_archivo,
                        tamano_bytes: e.tamano_bytes,
                        descripcion: e.descripcion,
                        meta: e.meta || {},
                        creado_por: transportistaId,
                    }),
                );
                await evidenciaRepo.save(evidencias);
            }

            await historyRepo.save({
                entrega_id: id,
                estado: EstadoEntrega.NO_ENTREGADO,
                cambiado_por_id: transportistaId,
                motivo: dto.motivo_no_entrega,
            });

            await this.outboxService.createEvent(
                'EntregaFallida',
                { entrega_id: id, pedido_id: entrega.pedido_id },
                'delivery',
                id,
                manager,
            );

            return saved;
        });
    }

    async addEvidence(entregaId: string, evidence: EvidenceInputDto, userId?: string) {
        const entrega = await this.entregaRepository.findOne({ where: { id: entregaId } });
        if (!entrega) throw new NotFoundException(`Entrega ${entregaId} no encontrada`);

        const evidencia = this.evidenciaRepository.create({
            entrega_id: entregaId,
            tipo: evidence.tipo as any,
            url: evidence.url,
            mime_type: evidence.mime_type,
            hash_archivo: evidence.hash_archivo,
            tamano_bytes: evidence.tamano_bytes,
            descripcion: evidence.descripcion,
            meta: evidence.meta || {},
            creado_por: userId,
        });

        return this.evidenciaRepository.save(evidencia);
    }

    async findOne(id: string): Promise<any> {
        const entrega = await this.entregaRepository.findOne({
            where: { id },
            relations: ['evidencias', 'incidencias'],
        });
        if (!entrega) {
            throw new NotFoundException(`Entrega ${id} no encontrada`);
        }
        return entrega;
    }

    async findAll(filters?: {
        transportista_id?: string;
        rutero_logistico_id?: string;
        pedido_id?: string;
        estado?: string;
        fecha?: string;
    }) {
        const qb = this.entregaRepository.createQueryBuilder('e');
        if (filters?.transportista_id) {
            qb.andWhere('e.transportista_id = :transportista_id', { transportista_id: filters.transportista_id });
        }
        if (filters?.rutero_logistico_id) {
            qb.andWhere('e.rutero_logistico_id = :rutero_logistico_id', { rutero_logistico_id: filters.rutero_logistico_id });
        }
        if (filters?.pedido_id) {
            qb.andWhere('e.pedido_id = :pedido_id', { pedido_id: filters.pedido_id });
        }
        if (filters?.estado) {
            qb.andWhere('e.estado = :estado', { estado: filters.estado });
        }
        if (filters?.fecha) {
            qb.andWhere('DATE(e.asignado_en) = :fecha', { fecha: filters.fecha });
        }
        qb.orderBy('e.asignado_en', 'DESC');
        return qb.getMany();
    }

    async findHistory(entregaId: string) {
        return this.historyRepository.find({
            where: { entrega_id: entregaId },
            order: { creado_en: 'DESC' },
        });
    }

    async cancelDelivery(id: string, dto: CancelDeliveryDto, userId: string) {
        return this.dataSource.transaction(async (manager) => {
            const entregaRepo = manager.getRepository(Entrega);
            const historyRepo = manager.getRepository(HistorialEstadoEntrega);

            const entrega = await entregaRepo.findOne({
                where: { id },
                lock: { mode: 'pessimistic_write' },
            });
            if (!entrega) throw new NotFoundException(`Entrega ${id} no encontrada`);
            if ([EstadoEntrega.ENTREGADO_COMPLETO, EstadoEntrega.ENTREGADO_PARCIAL, EstadoEntrega.CANCELADO].includes(entrega.estado)) {
                throw new BadRequestException('La entrega no puede ser cancelada');
            }

            entrega.estado = EstadoEntrega.CANCELADO;
            entrega.observaciones = dto.motivo;
            entrega.actualizado_por = userId;

            const saved = await entregaRepo.save(entrega);

            await historyRepo.save({
                entrega_id: id,
                estado: EstadoEntrega.CANCELADO,
                cambiado_por_id: userId,
                motivo: dto.motivo,
            });

            await this.outboxService.createEvent(
                'EntregaCancelada',
                { entrega_id: id, pedido_id: entrega.pedido_id },
                'delivery',
                id,
                manager,
            );

            return saved;
        });
    }
}

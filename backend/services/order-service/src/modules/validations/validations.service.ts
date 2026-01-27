import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { ValidacionBodega } from './entities/validacion-bodega.entity';
import { ItemValidacion } from './entities/item-validacion.entity';
import { CreateValidacionDto } from './dto/create-validacion.dto';
import { Pedido } from '../orders/entities/pedido.entity';
import { ItemPedido } from '../orders/entities/item-pedido.entity';
import { EstadoPedido } from '../../common/constants/order-status.enum';
import { EstadoItemResultado } from '../../common/constants/item-validation.enum';
import { CatalogExternalService } from '../../services/catalog-external.service';
import { OutboxService } from '../outbox/outbox.service';
import { HistorialEstadoPedido } from '../history/entities/historial-estado-pedido.entity';

type ValidacionResultado = CreateValidacionDto['items_resultados'][number];

@Injectable()
export class ValidationsService {
    constructor(
        @InjectRepository(ValidacionBodega)
        private readonly validacionRepo: Repository<ValidacionBodega>,
        private readonly dataSource: DataSource,
        private readonly catalogExternalService: CatalogExternalService,
        private readonly outboxService: OutboxService,
    ) {}

    async create(dto: CreateValidacionDto): Promise<ValidacionBodega> {
        return this.dataSource.transaction(async (manager) => {
            const pedido = await manager.findOne(Pedido, {
                where: { id: dto.pedido_id },
                relations: ['items'],
            });

            if (!pedido) {
                throw new NotFoundException(`Pedido ${dto.pedido_id} no encontrado`);
            }

            if (pedido.estado !== EstadoPedido.PENDIENTE_VALIDACION) {
                throw new BadRequestException('Solo se pueden validar pedidos pendientes');
            }

            if (!dto.items_resultados?.length) {
                throw new BadRequestException('Se deben enviar los resultados por ítem');
            }

            const itemCount = pedido.items.length;
            const uniqueItems = new Set(dto.items_resultados.map((item) => item.item_pedido_id));
            if (uniqueItems.size !== dto.items_resultados.length || dto.items_resultados.length !== itemCount) {
                throw new BadRequestException('Debe proveerse exactamente un resultado por cada ítem del pedido');
            }

            const itemsById = new Map(pedido.items.map((item) => [item.id, item]));

            const version = await this.getNextVersion(manager, pedido.id);
            const requiereAceptacion = this.requiresCliente(dto.items_resultados, itemsById);

            const validacion = manager.create(ValidacionBodega, {
                pedido_id: pedido.id,
                validado_por_id: dto.bodeguero_id,
                numero_version: version,
                motivo_general: dto.observaciones,
                requiere_aceptacion_cliente: requiereAceptacion,
            });

            const savedValidacion = await manager.save(ValidacionBodega, validacion);

            const itemsValidacion = [];
            for (const resultado of dto.items_resultados) {
                const pedidoItem = itemsById.get(resultado.item_pedido_id);
                if (!pedidoItem) {
                    throw new BadRequestException(`Item ${resultado.item_pedido_id} no pertenece al pedido`);
                }

                this.validateResultado(resultado, pedidoItem);
                const skuSnapshot = resultado.sku_aprobado_id
                    ? await this.catalogExternalService.getSkuSnapshot(resultado.sku_aprobado_id)
                    : null;

                if (resultado.sku_aprobado_id && !skuSnapshot) {
                    throw new NotFoundException(`SKU aprobado ${resultado.sku_aprobado_id} no encontrado`);
                }

                const validationItem = manager.create(ItemValidacion, {
                    validacion_id: savedValidacion.id,
                    item_pedido_id: pedidoItem.id,
                    estado_resultado: resultado.estado_resultado,
                    sku_aprobado_id: resultado.sku_aprobado_id,
                    sku_aprobado_nombre_snapshot: skuSnapshot?.nombre,
                    sku_aprobado_codigo_snapshot: skuSnapshot?.codigo,
                    cantidad_aprobada: this.resolveCantidadAprobada(resultado, pedidoItem),
                    motivo: resultado.motivo,
                });

                itemsValidacion.push(validationItem);
            }

            await manager.save(ItemValidacion, itemsValidacion);

            const estadoFinal = requiereAceptacion ? EstadoPedido.AJUSTADO_BODEGA : EstadoPedido.VALIDADO;
            pedido.estado = estadoFinal;
            pedido.actualizado_por = dto.bodeguero_id;
            await manager.save(Pedido, pedido);

            await this.recordHistory(
                manager,
                pedido.id,
                estadoFinal,
                dto.bodeguero_id,
                requiereAceptacion
                    ? `Validación con ajustes v${version}`
                    : `Validación sin ajustes v${version}`,
            );

            await this.outboxService.createEvent(
                requiereAceptacion ? 'PedidoAjustadoBodega' : 'PedidoValidado',
                {
                    pedido_id: pedido.id,
                    validacion_id: savedValidacion.id,
                    requiere_aceptacion: requiereAceptacion,
                },
                'order',
                pedido.id,
                manager,
            );

            return manager.findOne(ValidacionBodega, {
                where: { id: savedValidacion.id },
                relations: ['items'],
            });
        });
    }

    async findByOrder(pedidoId: string): Promise<ValidacionBodega[]> {
        return this.validacionRepo.find({
            where: { pedido_id: pedidoId },
            relations: ['items'],
            order: { numero_version: 'DESC' },
        });
    }

    async findOne(id: string): Promise<ValidacionBodega> {
        const validacion = await this.validacionRepo.findOne({
            where: { id },
            relations: ['items'],
        });

        if (!validacion) {
            throw new NotFoundException(`Validación ${id} no encontrada`);
        }

        return validacion;
    }

    private async getNextVersion(manager: EntityManager, pedidoId: string): Promise<number> {
        const lastValidation = await manager.findOne(ValidacionBodega, {
            where: { pedido_id: pedidoId },
            order: { numero_version: 'DESC' },
        });
        return lastValidation ? lastValidation.numero_version + 1 : 1;
    }

    private requiresCliente(results: ValidacionResultado[], itemsById: Map<string, ItemPedido>): boolean {
        return results.some((result) => {
            const pedidoItem = itemsById.get(result.item_pedido_id);
            if (!pedidoItem) {
                return true;
            }

            if (result.estado_resultado === EstadoItemResultado.RECHAZADO) {
                return true;
            }

            if (result.estado_resultado === EstadoItemResultado.APROBADO_PARCIAL) {
                return true;
            }

            if (result.estado_resultado === EstadoItemResultado.SUSTITUIDO) {
                return true;
            }

            if (
                result.estado_resultado === EstadoItemResultado.APROBADO &&
                result.cantidad_aprobada != null &&
                result.cantidad_aprobada < pedidoItem.cantidad_solicitada
            ) {
                return true;
            }

            return false;
        });
    }

    private resolveCantidadAprobada(resultado: ValidacionResultado, item: ItemPedido): number | null {
        if (resultado.estado_resultado === EstadoItemResultado.RECHAZADO) {
            return null;
        }

        if (resultado.cantidad_aprobada != null) {
            return resultado.cantidad_aprobada;
        }

        return item.cantidad_solicitada;
    }

    private validateResultado(resultado: ValidacionResultado, item: ItemPedido) {
        const cantidad = resultado.cantidad_aprobada;
        switch (resultado.estado_resultado) {
            case EstadoItemResultado.APROBADO:
                if (cantidad != null && (cantidad <= 0 || cantidad > item.cantidad_solicitada)) {
                    throw new BadRequestException('Cantidad aprobada inválida para ítem aprobado');
                }
                break;
            case EstadoItemResultado.APROBADO_PARCIAL:
                if (cantidad == null || cantidad <= 0 || cantidad >= item.cantidad_solicitada) {
                    throw new BadRequestException('La aprobación parcial debe tener cantidad menor que la solicitada');
                }
                break;
            case EstadoItemResultado.SUSTITUIDO:
                if (!resultado.sku_aprobado_id) {
                    throw new BadRequestException('La sustitución requiere un SKU aprobado');
                }
                if (cantidad == null || cantidad <= 0 || cantidad > item.cantidad_solicitada) {
                    throw new BadRequestException('Cantidad inválida para la sustitución');
                }
                break;
            case EstadoItemResultado.RECHAZADO:
                if (cantidad != null && cantidad > 0) {
                    throw new BadRequestException('No puede haber cantidad aprobada cuando se rechaza el ítem');
                }
                break;
        }
    }

    private async recordHistory(
        manager: EntityManager,
        pedidoId: string,
        estado: EstadoPedido,
        actorId: string,
        motivo: string,
    ) {
        const historial = manager.create(HistorialEstadoPedido, {
            pedido_id: pedidoId,
            estado,
            cambiado_por_id: actorId,
            motivo,
        });
        await manager.save(HistorialEstadoPedido, historial);
    }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ValidacionBodega } from './entities/validacion-bodega.entity';
import { ItemValidacion } from './entities/item-validacion.entity';
import { CreateValidacionDto } from './dto/create-validacion.dto';

@Injectable()
export class ValidationsService {
    constructor(
        @InjectRepository(ValidacionBodega)
        private readonly validacionRepo: Repository<ValidacionBodega>,
        @InjectRepository(ItemValidacion)
        private readonly itemValidacionRepo: Repository<ItemValidacion>,
        private readonly dataSource: DataSource,
    ) { }

    /**
     * Create a new validation (transactional)
     */
    async create(dto: CreateValidacionDto): Promise<ValidacionBodega> {
        return this.dataSource.transaction(async (manager) => {
            // Get current version for this order
            const lastValidation = await manager.findOne(ValidacionBodega, {
                where: { pedido_id: dto.pedido_id },
                order: { version: 'DESC' },
            });

            const version = lastValidation ? lastValidation.version + 1 : 1;

            // Create validation
            const validacion = manager.create(ValidacionBodega, {
                pedido_id: dto.pedido_id,
                bodeguero_id: dto.bodeguero_id,
                version,
                observaciones: dto.observaciones,
                estado: 'completada',
            });

            const savedValidacion = await manager.save(ValidacionBodega, validacion);

            // Create validation items
            const items = dto.items.map((itemDto) =>
                manager.create(ItemValidacion, {
                    validacion_id: savedValidacion.id,
                    ...itemDto,
                }),
            );

            await manager.save(ItemValidacion, items);

            // Return complete validation with items
            return manager.findOne(ValidacionBodega, {
                where: { id: savedValidacion.id },
                relations: ['items'],
            });
        });
    }

    /**
     * Find validations by order
     */
    async findByOrder(pedidoId: string): Promise<ValidacionBodega[]> {
        return this.validacionRepo.find({
            where: { pedido_id: pedidoId },
            relations: ['items'],
            order: { version: 'DESC' },
        });
    }

    /**
     * Find one validation
     */
    async findOne(id: string): Promise<ValidacionBodega> {
        const validacion = await this.validacionRepo.findOne({
            where: { id },
            relations: ['items', 'items.itemPedido'],
        });

        if (!validacion) {
            throw new NotFoundException(`Validación con ID ${id} no encontrada`);
        }

        return validacion;
    }
}

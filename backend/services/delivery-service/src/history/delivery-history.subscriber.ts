import {
    EventSubscriber,
    EntitySubscriberInterface,
    UpdateEvent,
    DataSource,
} from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { Entrega } from '../deliveries/entities/entrega.entity';
import { HistorialEstadoEntrega } from './entities/historial-estado-entrega.entity';

@Injectable()
@EventSubscriber()
export class DeliveryHistorySubscriber implements EntitySubscriberInterface<Entrega> {
    private readonly logger = new Logger(DeliveryHistorySubscriber.name);

    constructor(@InjectDataSource() dataSource: DataSource) {
        dataSource.subscribers.push(this);
    }

    listenTo() {
        return Entrega;
    }

    async afterUpdate(event: UpdateEvent<Entrega>): Promise<void> {
        const updatedEntity = event.entity as Entrega;
        const databaseEntity = event.databaseEntity;

        // Check if status has changed
        if (databaseEntity && databaseEntity.estado !== updatedEntity.estado) {
            this.logger.log(
                `Estado changed for entrega ${updatedEntity.id}: ${databaseEntity.estado} -> ${updatedEntity.estado}`,
            );

            const historial = new HistorialEstadoEntrega();
            historial.entregaId = updatedEntity.id;
            historial.estadoAnterior = databaseEntity.estado;
            historial.estadoNuevo = updatedEntity.estado;
            historial.observaciones = updatedEntity.observaciones;

            // Save history record
            await event.manager.save(HistorialEstadoEntrega, historial);
        }
    }
}

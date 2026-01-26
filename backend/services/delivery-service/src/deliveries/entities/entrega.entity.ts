import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { EstadoEntrega } from '../../common/constants/delivery-enums';
import { EvidenciaEntrega } from '../../evidence/entities/evidencia-entrega.entity';
import { IncidenciaEntrega } from '../../incidents/entities/incidencia-entrega.entity';

@Entity({ name: 'entregas', schema: 'app' })
export class Entrega {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'pedido_id', type: 'uuid' })
    pedidoId: string;

    @Column({ name: 'ruta_logistica_id', type: 'uuid', nullable: true })
    rutaLogisticaId: string;

    @Column({ name: 'conductor_id', type: 'uuid', nullable: true })
    conductorId: string;

    @Column({ name: 'vehiculo_id', type: 'uuid', nullable: true })
    vehiculoId: string;

    @Column({
        type: 'enum',
        enum: EstadoEntrega,
        default: EstadoEntrega.PENDIENTE,
    })
    estado: EstadoEntrega;

    @Column({ name: 'direccion_entrega', type: 'text' })
    direccionEntrega: string;

    @Column({ name: 'latitud_entrega', type: 'decimal', precision: 10, scale: 7, nullable: true })
    latitudEntrega: number;

    @Column({ name: 'longitud_entrega', type: 'decimal', precision: 10, scale: 7, nullable: true })
    longitudEntrega: number;

    @Column({ name: 'fecha_programada', type: 'timestamp', nullable: true })
    fechaProgramada: Date;

    @Column({ name: 'fecha_entrega_real', type: 'timestamp', nullable: true })
    fechaEntregaReal: Date;

    @Column({ name: 'cliente_nombre', type: 'varchar', length: 200 })
    clienteNombre: string;

    @Column({ name: 'cliente_telefono', type: 'varchar', length: 20, nullable: true })
    clienteTelefono: string;

    @Column({ name: 'receptor_nombre', type: 'varchar', length: 200, nullable: true })
    receptorNombre: string;

    @Column({ name: 'observaciones', type: 'text', nullable: true })
    observaciones: string;

    @Column({ name: 'cantidad_items_entregados', type: 'integer', default: 0 })
    cantidadItemsEntregados: number;

    @Column({ name: 'cantidad_items_total', type: 'integer', default: 0 })
    cantidadItemsTotal: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @OneToMany(() => EvidenciaEntrega, (evidencia) => evidencia.entrega)
    evidencias: EvidenciaEntrega[];

    @OneToMany(() => IncidenciaEntrega, (incidencia) => incidencia.entrega)
    incidencias: IncidenciaEntrega[];
}

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    DeleteDateColumn,
} from 'typeorm';

@Entity('zonas', { schema: 'app' })
export class Zone {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true, length: 20 })
    codigo: string;

    @Column({ length: 100 })
    nombre: string;

    @Column('text', { nullable: true })
    descripcion: string;

    @Column({ default: true })
    activo: boolean;

    // PostGIS Geometry Column
    @Index({ spatial: true })
    @Column({
        type: 'geometry',
        spatialFeatureType: 'MultiPolygon',
        srid: 4326,
        nullable: true,
    })
    zona_geom: object; // Se maneja como GeoJSON Object en JS

    @CreateDateColumn({ name: 'creado_en' })
    creadoEn: Date;

    @UpdateDateColumn({ name: 'actualizado_en' })
    actualizadoEn: Date;

    @Column({ name: 'creado_por', type: 'uuid', nullable: true })
    creadoPor: string;

    @Column({ name: 'actualizado_por', type: 'uuid', nullable: true })
    actualizadoPor: string;

    @Column({ default: 1 })
    version: number;

    @DeleteDateColumn({ name: 'eliminado_en', type: 'timestamptz', nullable: true })
    deletedAt?: Date;
}

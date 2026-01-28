import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoNotificacion } from './entities/tipo-notificacion.entity';

/**
 * Servicio para gestionar el catálogo de tipos de notificación.
 * Mantiene un cache en memoria para evitar queries repetidas.
 */
@Injectable()
export class TiposNotificacionService implements OnModuleInit {
    private readonly logger = new Logger(TiposNotificacionService.name);
    /** Cache codigo → id para lookup rápido */
    private readonly cacheByCode = new Map<string, string>();

    constructor(
        @InjectRepository(TipoNotificacion)
        private readonly tipoRepo: Repository<TipoNotificacion>,
    ) { }

    /**
     * Carga el cache al iniciar el módulo.
     */
    async onModuleInit(): Promise<void> {
        await this.loadCache();
    }

    /**
     * Carga todos los tipos activos en cache.
     */
    private async loadCache(): Promise<void> {
        const tipos = await this.tipoRepo.find({ where: { activo: true } });
        this.cacheByCode.clear();
        for (const tipo of tipos) {
            this.cacheByCode.set(tipo.codigo, tipo.id);
        }
        this.logger.log(`Cargados ${tipos.length} tipos de notificación en cache`);
    }

    /**
     * Obtiene el ID de un tipo por su código.
     * Primero busca en cache, si no existe busca en BD y actualiza cache.
     */
    async getIdByCodigo(codigo: string): Promise<string | null> {
        // Buscar en cache
        if (this.cacheByCode.has(codigo)) {
            return this.cacheByCode.get(codigo)!;
        }

        // Buscar en BD y actualizar cache
        const tipo = await this.tipoRepo.findOne({
            where: { codigo, activo: true },
        });

        if (tipo) {
            this.cacheByCode.set(codigo, tipo.id);
            return tipo.id;
        }

        return null;
    }

    /**
     * Obtiene el ID de un tipo por código, lanzando error si no existe.
     */
    async getIdByCodigoOrFail(codigo: string): Promise<string> {
        const id = await this.getIdByCodigo(codigo);
        if (!id) {
            throw new NotFoundException(`Tipo de notificación '${codigo}' no encontrado`);
        }
        return id;
    }

    /**
     * Lista todos los tipos de notificación activos.
     */
    async findAllActivos(): Promise<TipoNotificacion[]> {
        return this.tipoRepo.find({
            where: { activo: true },
            order: { nombre: 'ASC' },
        });
    }

    /**
     * Crea un nuevo tipo de notificación.
     */
    async create(data: {
        codigo: string;
        nombre: string;
        descripcion?: string;
        creadoPor?: string;
    }): Promise<TipoNotificacion> {
        const tipo = this.tipoRepo.create({
            codigo: data.codigo,
            nombre: data.nombre,
            descripcion: data.descripcion ?? null,
            creadoPor: data.creadoPor ?? null,
        });
        const saved = await this.tipoRepo.save(tipo);
        this.cacheByCode.set(saved.codigo, saved.id);
        this.logger.log(`Tipo de notificación creado: ${saved.codigo}`);
        return saved;
    }

    /**
     * Invalida y recarga el cache.
     */
    async invalidateCache(): Promise<void> {
        await this.loadCache();
    }
}

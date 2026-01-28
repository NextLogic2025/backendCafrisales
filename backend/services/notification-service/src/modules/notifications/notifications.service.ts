import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto, QueryNotificationsDto } from './dto/notification.dto';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(
        @InjectRepository(Notification)
        private readonly notificationRepo: Repository<Notification>,
    ) { }

    async create(dto: CreateNotificationDto): Promise<Notification> {
        const notification = this.notificationRepo.create({
            usuarioId: dto.usuarioId,
            tipo: dto.tipo,
            titulo: dto.titulo,
            mensaje: dto.mensaje,
            payload: dto.payload,
            origenServicio: dto.origenServicio,
            origenEventoId: dto.origenEventoId,
            prioridad: dto.prioridad || 'normal',
            requiereAccion: dto.requiereAccion || false,
            urlAccion: dto.urlAccion,
        });

        const saved = await this.notificationRepo.save(notification);
        this.logger.log(`Notification created: ${saved.id} for user ${saved.usuarioId}`);
        return saved;
    }

    async findAll(query: QueryNotificationsDto): Promise<Notification[]> {
        const qb = this.notificationRepo.createQueryBuilder('n');

        if (query.usuarioId) {
            qb.where('n.usuario_id = :usuarioId', { usuarioId: query.usuarioId });
        }

        if (query.tipo) {
            qb.andWhere('n.tipo = :tipo', { tipo: query.tipo });
        }

        if (query.soloNoLeidas) {
            qb.andWhere('n.leida = false');
        }

        qb.orderBy('n.creado_en', 'DESC');
        qb.limit(query.limit || 50);

        return qb.getMany();
    }

    async findOne(id: string): Promise<Notification> {
        const notification = await this.notificationRepo.findOne({ where: { id } });
        if (!notification) {
            throw new NotFoundException(`Notification ${id} not found`);
        }
        return notification;
    }

    async markAsRead(id: string): Promise<Notification> {
        const notification = await this.findOne(id);
        notification.leida = true;
        notification.leidaEn = new Date();
        return this.notificationRepo.save(notification);
    }

    async getUnreadCount(usuarioId: string): Promise<number> {
        return this.notificationRepo.count({
            where: { usuarioId, leida: false },
        });
    }

    async markAllAsRead(usuarioId: string): Promise<void> {
        await this.notificationRepo.update(
            { usuarioId, leida: false },
            { leida: true, leidaEn: new Date() },
        );
    }

    async deleteExpired(): Promise<void> {
        const result = await this.notificationRepo
            .createQueryBuilder()
            .delete()
            .where('expira_en IS NOT NULL AND expira_en < NOW()')
            .execute();

        if (result.affected > 0) {
            this.logger.log(`Deleted ${result.affected} expired notifications`);
        }
    }
}

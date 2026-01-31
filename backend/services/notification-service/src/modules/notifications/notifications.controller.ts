import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Put,
    Param,
    Query,
    UseGuards,
    ParseUUIDPipe,
    HttpCode,
    HttpStatus,
    ForbiddenException,
    BadRequestException,
    Delete,
    Header,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsGateway } from './notifications.gateway';
import { TiposNotificacionService } from './tipos-notificacion.service';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto, SubscriptionDto } from './dto/notification.dto';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { NotificationFilterDto } from './dto/notification-filter.dto';
import { BatchUpdateDto } from './dto/batch-update.dto';
import { createPaginatedResponse } from '../../common/interfaces/paginated-response.interface';

/** Roles que pueden acceder a notificaciones de otros usuarios */
const ADMIN_ROLES = ['admin', 'supervisor'];

@ApiTags('notifications')
@ApiBearerAuth()
@Controller({ path: 'notifications', version: '1' })
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(
        private readonly notificationsService: NotificationsService,
        private readonly notificationsGateway: NotificationsGateway,
        private readonly tiposService: TiposNotificacionService,
    ) { }

    @Post()
    @ApiOperation({ summary: 'Crear notificación (Interno/Admin)' })
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() dto: CreateNotificationDto, @CurrentUser() user: AuthUser) {
        // Solo admin/supervisor puede crear notificaciones vía API
        if (!ADMIN_ROLES.includes(user.role)) {
            throw new ForbiddenException('Solo administradores pueden crear notificaciones');
        }

        const notification = await this.notificationsService.create(dto);

        // Enviar via WebSocket si el usuario está conectado
        if (this.notificationsGateway.isUserConnected(notification.usuarioId)) {
            this.notificationsGateway.sendToUser(notification.usuarioId, notification);
        }

        return notification;
    }

    @Get()
    @ApiOperation({ summary: 'Listar notificaciones con paginación y filtros' })
    @Header('Cache-Control', 'no-store')
    async findAll(
        @Query() pagination: PaginationQueryDto,
        @Query() filters: NotificationFilterDto,
        @CurrentUser() user: AuthUser,
    ) {
        // Si no es admin/supervisor, forzar filtro por usuario actual
        let userId = filters.isRead === undefined ? user.userId : user.userId;
        if (ADMIN_ROLES.includes(user.role)) {
            // Admin could potentially filter by other users if filter DTO supports it, 
            // but for now let's enforce own notifications mostly or use valid logic
        } else {
            // Forzar usuario actual
        }

        // Using the new pagination service method
        const { data, meta } = await this.notificationsService.findAllPaginated(pagination, filters, user.userId);
        return createPaginatedResponse(data, meta.total, meta.page, meta.limit, meta.unreadCount);
    }


    @Get('unread-count')
    @ApiOperation({ summary: 'Obtener conteo de notificaciones no leídas' })
    @Header('Cache-Control', 'private, max-age=30')
    async getUnreadCount(@CurrentUser() user: AuthUser) {
        const count = await this.notificationsService.getUnreadCount(user.userId);
        return { count };
    }

    @Get('ws/stats')
    @ApiOperation({ summary: 'Obtener estadísticas de conexiones WebSocket' })
    async getWebSocketStats(@CurrentUser() user: AuthUser) {
        // Solo admin puede ver stats
        if (!ADMIN_ROLES.includes(user.role)) {
            throw new ForbiddenException('Acceso denegado');
        }
        return {
            connectedUsers: this.notificationsGateway.getConnectedUsersCount(),
        };
    }

    @Get('types')
    @ApiOperation({ summary: 'Listar tipos de notificación (activos)' })
    async getTypes() {
        return this.tiposService.findAllActivos();
    }

    @Get('subscriptions')
    @ApiOperation({ summary: 'Obtener suscripciones del usuario actual' })
    async getSubscriptions(@CurrentUser() user: AuthUser) {
        return this.notificationsService.getSubscriptions(user.userId);
    }

    @Put('subscriptions')
    @ApiOperation({ summary: 'Crear/actualizar suscripción del usuario a un tipo' })
    async upsertSubscription(@Body() dto: SubscriptionDto, @CurrentUser() user: AuthUser) {
        let tipoId = dto.tipoId;
        if (!tipoId) {
            if (!dto.tipoCodigo) throw new BadRequestException('tipoCodigo o tipoId requerido');
            tipoId = await this.tiposService.getIdByCodigoOrFail(dto.tipoCodigo);
        }

        await this.notificationsService.upsertSubscription(user.userId, {
            tipoId,
            websocketEnabled: typeof dto.websocketEnabled === 'undefined' ? null : dto.websocketEnabled,
            emailEnabled: typeof dto.emailEnabled === 'undefined' ? null : dto.emailEnabled,
            smsEnabled: typeof dto.smsEnabled === 'undefined' ? null : dto.smsEnabled,
        });

        return { message: 'Suscripción actualizada' };
    }

    @Patch('batch')
    @ApiOperation({ summary: 'Actualizar múltiples notificaciones' })
    @HttpCode(HttpStatus.OK)
    async batchUpdate(@Body() dto: BatchUpdateDto, @CurrentUser() user: AuthUser) {
        await this.notificationsService.markAsReadBatch(user.userId, dto.ids, dto.isRead);
        return { success: true };
    }

    @Patch('mark-all-read')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Marcar todas las notificaciones como leídas' })
    async markAllAsRead(@CurrentUser() user: AuthUser) {
        await this.notificationsService.markAllAsRead(user.userId);
        return { message: 'Todas las notificaciones marcadas como leídas' };
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener una notificación por ID' })
    async findOne(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: AuthUser,
    ) {
        const notification = await this.notificationsService.findOne(id);

        // Verificar que el usuario sea dueño o admin
        if (notification.usuarioId !== user.userId && !ADMIN_ROLES.includes(user.role)) {
            throw new ForbiddenException('No tienes acceso a esta notificación');
        }

        return notification;
    }

    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Marcar notificación como leída' })
    async markAsRead(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: AuthUser,
    ) {
        const notification = await this.notificationsService.findOne(id);

        // Solo el dueño puede marcar como leída
        if (notification.usuarioId !== user.userId) {
            throw new ForbiddenException('No puedes marcar esta notificación como leída');
        }

        return this.notificationsService.markAsRead(id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Eliminar notificación (Soft Delete)' })
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
        const notification = await this.notificationsService.findOne(id);
        if (notification.usuarioId !== user.userId && !ADMIN_ROLES.includes(user.role)) {
            throw new ForbiddenException('No tienes acceso para eliminar esta notificación');
        }
        await this.notificationsService.remove(id);
    }
}

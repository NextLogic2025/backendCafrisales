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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { TiposNotificacionService } from './tipos-notificacion.service';
import { CreateNotificationDto, QueryNotificationsDto, SubscriptionDto } from './dto/notification.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';

/** Roles que pueden acceder a notificaciones de otros usuarios */
const ADMIN_ROLES = ['admin', 'supervisor'];

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
    constructor(
        private readonly notificationsService: NotificationsService,
        private readonly notificationsGateway: NotificationsGateway,
        private readonly tiposService: TiposNotificacionService,
    ) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Crear una notificación (solo sistema/admin)' })
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
    @ApiOperation({ summary: 'Obtener notificaciones del usuario actual' })
    async findAll(@Query() query: QueryNotificationsDto, @CurrentUser() user: AuthUser) {
        // Si no es admin/supervisor, forzar filtro por usuario actual
        if (!ADMIN_ROLES.includes(user.role)) {
            query.usuarioId = user.userId;
        }
        return this.notificationsService.findAll(query);
    }

    /**
     * Endpoint de conteo de no leídas.
     * IMPORTANTE: Rutas específicas van ANTES de rutas con parámetros (:id)
     */
    @Get('unread/count')
    @ApiOperation({ summary: 'Contar notificaciones no leídas' })
    async getUnreadCount(@CurrentUser() user: AuthUser) {
        return {
            count: await this.notificationsService.getUnreadCount(user.userId),
        };
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

    @Patch('mark-all-read')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Marcar todas las notificaciones como leídas' })
    async markAllAsRead(@CurrentUser() user: AuthUser) {
        await this.notificationsService.markAllAsRead(user.userId);
        return { message: 'Todas las notificaciones marcadas como leídas' };
    }

    /**
     * Obtener notificación por ID.
     * IMPORTANTE: Esta ruta con :id va DESPUÉS de rutas específicas.
     */
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

    @Patch(':id/mark-read')
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
}

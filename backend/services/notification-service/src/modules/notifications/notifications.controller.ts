import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { CreateNotificationDto, QueryNotificationsDto, MarkAsReadDto } from './dto/notification.dto';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
    constructor(
        private readonly notificationsService: NotificationsService,
        private readonly notificationsGateway: NotificationsGateway,
    ) { }

    @Post()
    @ApiOperation({ summary: 'Crear una notificación' })
    async create(@Body() dto: CreateNotificationDto) {
        const notification = await this.notificationsService.create(dto);

        // Enviar via WebSocket si el usuario está conectado
        if (this.notificationsGateway.isUserConnected(notification.usuarioId)) {
            this.notificationsGateway.sendToUser(notification.usuarioId, notification);
        }

        return notification;
    }

    @Get()
    @ApiOperation({ summary: 'Obtener notificaciones' })
    async findAll(@Query() query: QueryNotificationsDto) {
        return this.notificationsService.findAll(query);
    }

    @Get('unread/count')
    @ApiOperation({ summary: 'Contar notificaciones no leídas' })
    async getUnreadCount(@Query('usuarioId') usuarioId: string) {
        return {
            count: await this.notificationsService.getUnreadCount(usuarioId),
        };
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener una notificación por ID' })
    async findOne(@Param('id') id: string) {
        return this.notificationsService.findOne(id);
    }

    @Patch(':id/mark-read')
    @ApiOperation({ summary: 'Marcar notificación como leída' })
    async markAsRead(@Param('id') id: string) {
        return this.notificationsService.markAsRead(id);
    }

    @Patch('mark-all-read')
    @ApiOperation({ summary: 'Marcar todas las notificaciones como leídas' })
    async markAllAsRead(@Query('usuarioId') usuarioId: string) {
        await this.notificationsService.markAllAsRead(usuarioId);
        return { message: 'All notifications marked as read' };
    }

    @Get('ws/stats')
    @ApiOperation({ summary: 'Obtener estadísticas de conexiones WebSocket' })
    async getWebSocketStats() {
        return {
            connectedUsers: this.notificationsGateway.getConnectedUsersCount(),
        };
    }
}

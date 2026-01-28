import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    Query,
    UseGuards,
    ParseUUIDPipe,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { CreateNotificationDto, QueryNotificationsDto } from './dto/notification.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
    constructor(
        private readonly notificationsService: NotificationsService,
        private readonly notificationsGateway: NotificationsGateway,
    ) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.CREATED)
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
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Obtener notificaciones' })
    async findAll(@Query() query: QueryNotificationsDto, @CurrentUser() user?: AuthUser) {
        // Si no es admin/supervisor, forzar filtro por usuario actual
        if (user && !['admin', 'supervisor'].includes(user.role)) {
            query.usuarioId = user.userId;
        }
        return this.notificationsService.findAll(query);
    }

    @Get('unread/count')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Contar notificaciones no leídas' })
    async getUnreadCount(@CurrentUser() user?: AuthUser) {
        const usuarioId = user?.userId;
        if (!usuarioId) {
            return { count: 0 };
        }
        return {
            count: await this.notificationsService.getUnreadCount(usuarioId),
        };
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Obtener una notificación por ID' })
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.notificationsService.findOne(id);
    }

    @Patch(':id/mark-read')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Marcar notificación como leída' })
    async markAsRead(@Param('id', ParseUUIDPipe) id: string) {
        return this.notificationsService.markAsRead(id);
    }

    @Patch('mark-all-read')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Marcar todas las notificaciones como leídas' })
    async markAllAsRead(@CurrentUser() user?: AuthUser) {
        const usuarioId = user?.userId;
        if (!usuarioId) {
            return { message: 'No user found' };
        }
        await this.notificationsService.markAllAsRead(usuarioId);
        return { message: 'Todas las notificaciones marcadas como leídas' };
    }

    @Get('ws/stats')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Obtener estadísticas de conexiones WebSocket' })
    async getWebSocketStats() {
        return {
            connectedUsers: this.notificationsGateway.getConnectedUsersCount(),
        };
    }
}

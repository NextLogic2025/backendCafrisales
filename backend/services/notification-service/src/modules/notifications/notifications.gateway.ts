import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';
import { CanalNotificacion } from './entities/historial-envio.entity';

interface JwtPayload {
    sub: string;
    role: string;
    iat?: number;
    exp?: number;
}

/**
 * WebSocket Gateway para notificaciones en tiempo real.
 * Valida JWT en el handshake antes de aceptar la conexión.
 *
 * Los clientes se conectan con:
 * const socket = io('http://localhost:3000/notifications', {
 *   auth: { token: 'jwt-token' }
 * });
 */
@WebSocketGateway({
    cors: {
        origin: process.env.CORS_ORIGIN?.split(',') ?? '*',
        credentials: true,
    },
    namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(NotificationsGateway.name);
    /** Mapa de userId → Set<socketId> para tracking de conexiones */
    private readonly connectedUsers = new Map<string, Set<string>>();
    /** Mapa inverso socketId → userId para lookup rápido en disconnect */
    private readonly socketToUser = new Map<string, string>();

    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly notificationsService: NotificationsService,
    ) { }

    /**
     * Valida el token JWT del handshake y registra la conexión.
     * Rechaza conexiones sin token válido.
     */
    async handleConnection(client: Socket): Promise<void> {
        const token = client.handshake.auth?.token;

        if (!token) {
            this.logger.warn(`Cliente ${client.id} conectado sin token, desconectando`);
            client.emit('error', { message: 'Token requerido' });
            client.disconnect();
            return;
        }

        try {
            const payload = this.jwtService.verify<JwtPayload>(token, {
                secret: this.configService.get<string>('JWT_SECRET'),
            });

            const userId = payload.sub;
            if (!userId) {
                throw new Error('Token inválido: falta sub');
            }

            // Guardar userId en el socket para acceso posterior
            (client as Socket & { userId: string }).userId = userId;

            // Unir a room del usuario
            client.join(`user:${userId}`);

            // Registrar conexión
            if (!this.connectedUsers.has(userId)) {
                this.connectedUsers.set(userId, new Set());
            }
            this.connectedUsers.get(userId)!.add(client.id);
            this.socketToUser.set(client.id, userId);

            this.logger.log(`Cliente ${client.id} conectado para usuario ${userId}`);
            this.logger.debug(`Total usuarios conectados: ${this.connectedUsers.size}`);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Token inválido';
            this.logger.warn(`Token inválido para cliente ${client.id}: ${message}`);
            client.emit('error', { message: 'Token inválido o expirado' });
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket): void {
        const userId = this.socketToUser.get(client.id);

        if (userId) {
            const userSockets = this.connectedUsers.get(userId);
            if (userSockets) {
                userSockets.delete(client.id);
                if (userSockets.size === 0) {
                    this.connectedUsers.delete(userId);
                }
            }
            this.socketToUser.delete(client.id);
        }

        this.logger.log(`Cliente ${client.id} desconectado`);
    }

    /**
     * Envía una notificación a un usuario específico.
     * Solo envía campos necesarios para el frontend.
     */
    sendToUser(userId: string, notification: Notification): void {
        this.server.to(`user:${userId}`).emit('notification', {
            id: notification.id,
            tipoId: notification.tipoId,
            titulo: notification.titulo,
            mensaje: notification.mensaje,
            payload: notification.payload,
            prioridad: notification.prioridad,
            requiereAccion: notification.requiereAccion,
            urlAccion: notification.urlAccion,
            creadoEn: notification.createdAt,
        });

        this.logger.log(`Notificación ${notification.id} enviada a usuario ${userId}`);

        // Registrar historial de envío (asumimos envío por WS)
        try {
            this.notificationsService.recordHistorial(notification.id, CanalNotificacion.WEBSOCKET, true).catch(err => {
                this.logger.warn(`No se pudo registrar historial para notificación ${notification.id}: ${err?.message ?? err}`);
            });
        } catch (err) {
            this.logger.warn(`Error registrando historial de notificación ${notification.id}: ${err?.message ?? err}`);
        }
    }

    /**
     * Broadcast a todos los usuarios conectados (solo admin/sistema).
     */
    broadcast(notification: Notification): void {
        this.server.emit('notification', notification);
        this.logger.log(`Broadcast notificación ${notification.id}`);
    }

    getConnectedUsersCount(): number {
        return this.connectedUsers.size;
    }

    isUserConnected(userId: string): boolean {
        return this.connectedUsers.has(userId);
    }

    @SubscribeMessage('ping')
    handlePing(@ConnectedSocket() client: Socket): string {
        return 'pong';
    }

    /**
     * Marca una notificación como leída via WebSocket.
     * Valida que el usuario sea el dueño antes de persistir.
     */
    @SubscribeMessage('mark_read')
    async handleMarkAsRead(
        @MessageBody() data: { notificationId: string },
        @ConnectedSocket() client: Socket,
    ): Promise<{ success: boolean; error?: string }> {
        const userId = (client as Socket & { userId?: string }).userId;

        if (!userId) {
            return { success: false, error: 'No autenticado' };
        }

        if (!data?.notificationId) {
            return { success: false, error: 'notificationId requerido' };
        }

        try {
            const notification = await this.notificationsService.findOne(data.notificationId);

            // Verificar que el usuario sea el dueño
            if (notification.usuarioId !== userId) {
                this.logger.warn(`Usuario ${userId} intentó marcar notificación ${data.notificationId} que no le pertenece`);
                return { success: false, error: 'No autorizado' };
            }

            await this.notificationsService.markAsRead(data.notificationId);
            this.logger.log(`Usuario ${userId} marcó notificación ${data.notificationId} como leída via WS`);

            return { success: true };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error desconocido';
            this.logger.error(`Error marcando notificación como leída: ${message}`);
            return { success: false, error: message };
        }
    }

    /**
     * Marca todas las notificaciones del usuario como leídas via WebSocket.
     */
    @SubscribeMessage('mark_all_read')
    async handleMarkAllAsRead(
        @ConnectedSocket() client: Socket,
    ): Promise<{ success: boolean; error?: string }> {
        const userId = (client as Socket & { userId?: string }).userId;

        if (!userId) {
            return { success: false, error: 'No autenticado' };
        }

        try {
            await this.notificationsService.markAllAsRead(userId);
            this.logger.log(`Usuario ${userId} marcó todas las notificaciones como leídas via WS`);
            return { success: true };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error desconocido';
            return { success: false, error: message };
        }
    }
}

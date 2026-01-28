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
import { Logger, UseGuards } from '@nestjs/common';
import { Notification } from './entities/notification.entity';

/**
 * WebSocket Gateway para notificaciones en tiempo real
 * 
 * Los clientes se conectan con:
 * const socket = io('http://localhost:3000/notifications', {
 *   auth: { userId: 'uuid-del-usuario' }
 * });
 */
@WebSocketGateway({
    cors: { origin: '*' },
    namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(NotificationsGateway.name);
    private readonly connectedUsers = new Map<string, Set<string>>(); // userId -> Set<socketId>

    handleConnection(client: Socket) {
        const userId = client.handshake.auth?.userId;

        if (!userId) {
            this.logger.warn(`Client ${client.id} connected without userId, disconnecting`);
            client.disconnect();
            return;
        }

        // Join user room
        client.join(`user:${userId}`);

        // Track connection
        if (!this.connectedUsers.has(userId)) {
            this.connectedUsers.set(userId, new Set());
        }
        this.connectedUsers.get(userId).add(client.id);

        this.logger.log(`Client ${client.id} connected for user ${userId}`);
        this.logger.debug(`Total connected users: ${this.connectedUsers.size}`);
    }

    handleDisconnect(client: Socket) {
        const userId = client.handshake.auth?.userId;

        if (userId) {
            const userSockets = this.connectedUsers.get(userId);
            if (userSockets) {
                userSockets.delete(client.id);
                if (userSockets.size === 0) {
                    this.connectedUsers.delete(userId);
                }
            }
        }

        this.logger.log(`Client ${client.id} disconnected`);
    }

    /**
     * Envía una notificación a un usuario específico
     */
    sendToUser(userId: string, notification: Notification) {
        this.server.to(`user:${userId}`).emit('notification', {
            id: notification.id,
            tipo: notification.tipo,
            titulo: notification.titulo,
            mensaje: notification.mensaje,
            payload: notification.payload,
            prioridad: notification.prioridad,
            requiereAccion: notification.requiereAccion,
            urlAccion: notification.urlAccion,
            creadoEn: notification.creadoEn,
        });

        this.logger.log(`Notification ${notification.id} sent to user ${userId}`);
    }

    /**
     * Broadcast a todos los usuarios conectados
     */
    broadcast(notification: Notification) {
        this.server.emit('notification', notification);
        this.logger.log(`Broadcast notification ${notification.id}`);
    }

    /**
     * Obtiene el número de usuarios conectados
     */
    getConnectedUsersCount(): number {
        return this.connectedUsers.size;
    }

    /**
     * Verifica si un usuario está conectado
     */
    isUserConnected(userId: string): boolean {
        return this.connectedUsers.has(userId);
    }

    @SubscribeMessage('ping')
    handlePing(@ConnectedSocket() client: Socket): string {
        return 'pong';
    }

    @SubscribeMessage('mark_read')
    handleMarkAsRead(
        @MessageBody() data: { notificationId: string },
        @ConnectedSocket() client: Socket,
    ): void {
        const userId = client.handshake.auth?.userId;
        this.logger.log(`User ${userId} marked notification ${data.notificationId} as read`);
        // El controlador HTTP también puede manejar esto
    }
}

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
import { PrismaService } from '../../prisma/prisma.service';
import { PushService } from './push.service';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, { userId: string; userName: string }>();

  constructor(
    private prisma: PrismaService,
    private pushService: PushService,
  ) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.connectedUsers.delete(client.id);
    this.broadcastPresence();
  }

  @SubscribeMessage('presence:join')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string; userName: string },
  ) {
    this.connectedUsers.set(client.id, {
      userId: data.userId,
      userName: data.userName,
    });
    this.broadcastPresence();
  }

  private broadcastPresence() {
    const unique = new Map<string, string>();
    for (const { userId, userName } of this.connectedUsers.values()) {
      unique.set(userId, userName);
    }
    const onlineUsers = Array.from(unique.entries()).map(([id, name]) => ({
      id,
      name,
    }));
    this.server.emit('presence:update', onlineUsers);
  }

  async notifyUserCreated(user: any, actorName: string) {
    const notification = await this.prisma.notification.create({
      data: {
        type: 'user:created',
        message: `${actorName} created ${user.name}`,
        actorName,
        userId: user.id,
      },
    });
    this.server.emit('user:created', { ...user, notification });
    this.pushService.sendToAll('Nouvel utilisateur', `${actorName} a créé ${user.name}`);
  }

  async notifyUserUpdated(user: any, actorName: string) {
    const notification = await this.prisma.notification.create({
      data: {
        type: 'user:updated',
        message: `${actorName} updated ${user.name}`,
        actorName,
        userId: user.id,
      },
    });
    this.server.emit('user:updated', { ...user, notification });
    this.pushService.sendToAll('Utilisateur modifié', `${actorName} a modifié ${user.name}`);
  }

  async notifyUserDeleted(id: string, targetName: string, actorName: string) {
    const notification = await this.prisma.notification.create({
      data: {
        type: 'user:deleted',
        message: `${actorName} deleted ${targetName}`,
        actorName,
      },
    });
    this.server.emit('user:deleted', { id, actorName, targetName, notification });
    this.pushService.sendToAll('Utilisateur supprimé', `${actorName} a supprimé ${targetName}`);
  }
}

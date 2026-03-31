import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../../prisma/prisma.service';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private prisma: PrismaService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  async notifyUserCreated(user: any) {
    await this.prisma.notification.create({
      data: { type: 'user:created', message: `User ${user.name} created`, userId: user.id },
    });
    this.server.emit('user:created', user);
  }

  async notifyUserUpdated(user: any) {
    await this.prisma.notification.create({
      data: { type: 'user:updated', message: `User ${user.name} updated`, userId: user.id },
    });
    this.server.emit('user:updated', user);
  }

  async notifyUserDeleted(id: string) {
    await this.prisma.notification.deleteMany({ where: { userId: id } });
    this.server.emit('user:deleted', { id });
  }
}

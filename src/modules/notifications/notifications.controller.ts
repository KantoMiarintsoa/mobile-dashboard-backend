import { Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private prisma: PrismaService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Patch('read')
  async markAllRead() {
    await this.prisma.notification.updateMany({
      where: { read: false },
      data: { read: true },
    });
    return { message: 'All notifications marked as read' };
  }
}

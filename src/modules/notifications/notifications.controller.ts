import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { PushService } from './push.service';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private prisma: PrismaService,
    private pushService: PushService,
  ) {}

  @Get('vapid-public-key')
  getVapidPublicKey() {
    return { key: this.pushService.getPublicKey() };
  }

  @UseGuards(JwtAuthGuard)
  @Post('push/subscribe')
  subscribe(@Body() body: { endpoint: string; keys: { p256dh: string; auth: string } }, @Request() req) {
    this.pushService.subscribe(req.user.id, body);
    return { message: 'Subscribed' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('push/unsubscribe')
  unsubscribe(@Request() req) {
    this.pushService.unsubscribe(req.user.id);
    return { message: 'Unsubscribed' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('stats')
  async getStats(@Query('days') days?: string) {
    const nbDays = Math.min(Number(days) || 7, 30);
    const since = new Date();
    since.setDate(since.getDate() - nbDays);
    since.setHours(0, 0, 0, 0);

    const notifications = await this.prisma.notification.findMany({
      where: { createdAt: { gte: since } },
      select: { type: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const map = new Map<string, { created: number; updated: number; deleted: number }>();

    for (let i = 0; i <= nbDays; i++) {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      map.set(key, { created: 0, updated: 0, deleted: 0 });
    }

    for (const n of notifications) {
      const key = n.createdAt.toISOString().slice(0, 10);
      const entry = map.get(key);
      if (!entry) continue;
      if (n.type === 'user:created') entry.created++;
      else if (n.type === 'user:updated') entry.updated++;
      else if (n.type === 'user:deleted') entry.deleted++;
    }

    return Array.from(map.entries()).map(([date, counts]) => ({
      date,
      ...counts,
    }));
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('count')
  async count() {
    const total = await this.prisma.notification.count();
    const unread = await this.prisma.notification.count({ where: { read: false } });
    return { total, unread };
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

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.prisma.notification.delete({ where: { id } });
    return { message: 'Notification deleted' };
  }

  @UseGuards(JwtAuthGuard)
  @Delete()
  async removeAll() {
    await this.prisma.notification.deleteMany();
    return { message: 'All notifications deleted' };
  }
}

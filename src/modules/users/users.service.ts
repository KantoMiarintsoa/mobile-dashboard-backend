import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsGateway,
  ) {}

  async create(dto: RegisterDto, actorName: string) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('Email already in use');

    const hash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { name: dto.name, email: dto.email, password: hash },
    });
    const { password, ...result } = user;
    this.notifications.notifyUserCreated(result, actorName);
    return result;
  }

  async findAll(search?: string) {
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : undefined;
    const users = await this.prisma.user.findMany({ where });
    return users.map(({ password, ...user }) => user);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    const { password, ...result } = user;
    return result;
  }

  async update(id: string, dto: UpdateUserDto, actorName: string) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
    }
    const user = await this.prisma.user.update({ where: { id }, data });
    const { password, ...result } = user;
    this.notifications.notifyUserUpdated(result, actorName);
    return result;
  }

  async remove(id: string, actorName: string) {
    const user = await this.findOne(id);
    await this.prisma.user.delete({ where: { id } });
    this.notifications.notifyUserDeleted(id, user.name, actorName);
    return { message: 'User deleted' };
  }

  async removeAll(actorId: string) {
    const count = await this.prisma.user.count({ where: { id: { not: actorId } } });
    await this.prisma.user.deleteMany({ where: { id: { not: actorId } } });
    return { message: `${count} users deleted`, count };
  }
}

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterDto } from './dto/register.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('create')
  create(@Body() dto: RegisterDto, @Request() req) {
    return this.users.create(dto, req.user.name);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req) {
    return this.users.findOne(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('list')
  findAll(@Query('search') search?: string) {
    return this.users.findAll(search);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/details')
  findOne(@Param('id') id: string) {
    return this.users.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put(':id/update')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto, @Request() req) {
    return this.users.update(id, dto, req.user.name);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put(':id/toggle-active')
  toggleActive(@Param('id') id: string) {
    return this.users.toggleActive(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('delete-all')
  removeAll(@Request() req) {
    return this.users.removeAll(req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id/delete')
  remove(@Param('id') id: string, @Request() req) {
    return this.users.remove(id, req.user.name);
  }
}

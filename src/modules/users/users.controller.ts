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

@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  create(@Body() dto: RegisterDto) {
    return this.users.create(dto);
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

  @UseGuards(JwtAuthGuard)
  @Put(':id/update')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.users.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/delete')
  remove(@Param('id') id: string) {
    return this.users.remove(id);
  }
}

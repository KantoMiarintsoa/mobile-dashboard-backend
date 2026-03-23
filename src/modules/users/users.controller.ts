import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterDto } from '../auth/dto/register.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.users.register(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req) {
    return this.users.findOne(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('list')
  findAll() {
    return this.users.findAll();
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

import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './users.entity';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserCreationGuard } from '../auth/user-creation.guard';

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles('superadmin', 'admin')
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles('superadmin', 'admin', 'user')
  async findOne(@Param('id') id: number): Promise<User> {
    return this.usersService.findById(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard, UserCreationGuard)
  @Roles('superadmin', 'admin')
  async create(@Body() userData: Partial<User>): Promise<User> {
    return this.usersService.create(userData);
  }

  @Put(':id')
  @Roles('superadmin', 'admin', 'user')
  async update(@Param('id') id: number, @Body() userData: Partial<User>): Promise<User> {
    return this.usersService.update(id, userData);
  }

  @Delete(':id')
  @Roles('superadmin', 'admin')
  async remove(@Param('id') id: number): Promise<void> {
    return this.usersService.remove(id);
  }
}
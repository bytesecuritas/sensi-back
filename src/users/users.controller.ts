import { Body, Controller, Delete, Get, Param, Put, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { User } from './users.entity';
import { UsersService } from './users.service';

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

  @Put(':id/password')
  async changePassword(
    @Param('id') id: number,
    @Body() body: { currentPassword: string; newPassword: string },
    @Request() req: any
  ): Promise<{ message: string }> {
    // Vérifier que l'utilisateur modifie son propre mot de passe
    if (id !== req.user?.users_id) {
      throw new Error('Vous ne pouvez modifier que votre propre mot de passe');
    }
    
    const result = await this.usersService.changePassword(id, body.currentPassword, body.newPassword);
    return { message: 'Mot de passe modifié avec succès' };
  }
}
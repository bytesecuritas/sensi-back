import { Controller, Post, Body, UseGuards, HttpException, HttpStatus, Get, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { IsEmail, IsString, MinLength, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { UserCreationGuard } from './user-creation.guard';

// DTOs pour la validation
class RegisterDto {
  @IsEmail()
  email: string;
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;
  @IsString()
  @IsNotEmpty()
  nom: string;
  @IsString()
  @IsNotEmpty()
  prenom: string;
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  age: number;
  @IsString()
  @IsNotEmpty()
  role: string;
  @IsString()
  @IsOptional()
  code_langue?: string;
  @IsString()
  @IsOptional()
  organisation_id?: string;
}

class LoginDto {
  @IsEmail()
  email: string;
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @UseGuards(AuthGuard('jwt'), RolesGuard, UserCreationGuard)
  @Roles('superadmin', 'admin')
  async register(@Body() body: RegisterDto) {
    try {
      return await this.authService.register(
        body.email, 
        body.password, 
        body.nom, 
        body.prenom, 
        body.age, 
        body.role,
        body.code_langue,
        body.organisation_id
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Registration failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('login')
  async login(@Body() body: LoginDto) {
    try {
      const user = await this.authService.validateUser(body.email, body.password);
      if (!user) {
        throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
      }
      // Retourne access_token et refresh_token
      return this.authService.login(user);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Login failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Request() req) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new HttpException('Utilisateur non authentifié', HttpStatus.UNAUTHORIZED);
    }
    return await this.authService.getProfile(userId);
  }
}
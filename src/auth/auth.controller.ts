import { Controller, Post, Body, UseGuards, HttpException, HttpStatus, Get, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { IsEmail, IsString, MinLength, IsNotEmpty, IsNumber, IsOptional, Min, Matches } from 'class-validator';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { UserCreationGuard } from './user-creation.guard';
import { Throttle } from '@nestjs/throttler';

// DTOs pour la validation
class RegisterDto {
  @IsEmail()
  email: string;
  
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/, {
    message: 'Password must contain at least 8 characters, including uppercase, lowercase, numbers, and special characters'
  })
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

class ChangePasswordDto {
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  currentPassword: string;
  
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/, {
    message: 'Password must contain at least 8 characters, including uppercase, lowercase, numbers, and special characters'
  })
  newPassword: string;
}

class ResetPasswordRequestDto {
  @IsEmail()
  email: string;
}

class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;
  
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/, {
    message: 'Password must contain at least 8 characters, including uppercase, lowercase, numbers, and special characters'
  })
  newPassword: string;
}

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Créer un utilisateur' })
  @ApiBearerAuth('bearer')
  @ApiResponse({ status: 201, description: 'Utilisateur créé' })
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
  @ApiOperation({ summary: 'Authentification' })
  @ApiResponse({ status: 200, description: 'Jetons retournés' })
  // @Throttle(5, 60) // 5 login attempts per minute
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

  @Post('logout')
  @ApiOperation({ summary: 'Déconnexion' })
  @ApiBearerAuth('bearer')
  @ApiResponse({ status: 200, description: 'Déconnexion réussie' })
  @UseGuards(AuthGuard('jwt'))
  async logout(@Request() req) {
    try {
      const userId = req.user?.users_id;
      if (!userId) {
        throw new HttpException('Utilisateur non authentifié', HttpStatus.UNAUTHORIZED);
      }
      return await this.authService.logout(userId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Logout failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('change-password')
  @ApiOperation({ summary: 'Changer le mot de passe' })
  @ApiBearerAuth('bearer')
  @ApiResponse({ status: 200, description: 'Mot de passe changé avec succès' })
  @UseGuards(AuthGuard('jwt'))
  async changePassword(@Request() req, @Body() body: ChangePasswordDto) {
    try {
      const userId = req.user?.users_id;
      if (!userId) {
        throw new HttpException('Utilisateur non authentifié', HttpStatus.UNAUTHORIZED);
      }
      return await this.authService.changePassword(userId, body.currentPassword, body.newPassword);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Password change failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('reset-password-request')
  @ApiOperation({ summary: 'Demande de réinitialisation de mot de passe' })
  @ApiResponse({ status: 200, description: 'Email de réinitialisation envoyé' })
  // @Throttle(3, 300) // 3 requests per 5 minutes
  async resetPasswordRequest(@Body() body: ResetPasswordRequestDto) {
    try {
      return await this.authService.resetPasswordRequest(body.email);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Reset password request failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Réinitialiser le mot de passe' })
  @ApiResponse({ status: 200, description: 'Mot de passe réinitialisé avec succès' })
  async resetPassword(@Body() body: ResetPasswordDto) {
    try {
      return await this.authService.resetPassword(body.token, body.newPassword);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Reset password failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


  @Get('profile')
  @ApiOperation({ summary: 'Obtenir mes informations selon mon rôle' })
  @ApiResponse({ status: 200, description: 'Informations récupérées avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiBearerAuth('bearer')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Request() req) {
    try {
      const userId = req.user?.users_id;
      if (!userId) {
        throw new HttpException('Utilisateur non authentifié', HttpStatus.UNAUTHORIZED);
      }
      return await this.authService.getProfile(userId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Erreur lors de la récupération des informations', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
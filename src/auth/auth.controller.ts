import { Controller, Post, Body, UseGuards, HttpException, HttpStatus, Get, Request, Response } from '@nestjs/common';
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

  @Get('swagger-login')
  @ApiOperation({ summary: 'Page de connexion pour Swagger (Superadmin uniquement)' })
  @ApiResponse({ status: 200, description: 'Page de connexion HTML' })
  async getSwaggerLoginPage(@Response() res) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Connexion Swagger - Superadmin</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
          .container { max-width: 400px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          h1 { color: #333; text-align: center; margin-bottom: 30px; }
          .form-group { margin-bottom: 20px; }
          label { display: block; margin-bottom: 5px; color: #555; }
          input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
          button { width: 100%; padding: 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
          button:hover { background: #0056b3; }
          .error { color: red; margin-top: 10px; text-align: center; }
          .success { color: green; margin-top: 10px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🔐 Connexion Swagger</h1>
          <p style="text-align: center; color: #666; margin-bottom: 30px;">Accès réservé aux Superadmins</p>
          
          <form id="loginForm">
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" name="email" required placeholder="superadmin@example.com">
            </div>
            
            <div class="form-group">
              <label for="password">Mot de passe</label>
              <input type="password" id="password" name="password" required placeholder="Votre mot de passe">
            </div>
            
            <button type="submit">Se connecter</button>
          </form>
          
          <div id="message"></div>
        </div>

        <script>
          document.getElementById('loginForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const messageDiv = document.getElementById('message');
            
            try {
              const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
              });
              
              const data = await response.json();
              
              if (response.ok) {
                // Vérifier que l'utilisateur est superadmin
                if (data.user && data.user.role === 'superadmin') {
                  // Stocker le token pour Swagger
                  localStorage.setItem('swagger_authorization_superadmin', data.access_token);
                  localStorage.setItem('swagger_authorization_bearer', data.access_token);
                  
                  messageDiv.innerHTML = '<div class="success">✅ Connexion réussie ! Redirection vers Swagger...</div>';
                  
                  // Rediriger vers Swagger après 2 secondes
                  setTimeout(() => {
                    window.location.href = '/api/docs';
                  }, 2000);
                } else {
                  messageDiv.innerHTML = '<div class="error">❌ Accès refusé : Rôle superadmin requis</div>';
                }
              } else {
                messageDiv.innerHTML = '<div class="error">❌ Erreur de connexion : ' + (data.message || 'Identifiants invalides') + '</div>';
              }
            } catch (error) {
              messageDiv.innerHTML = '<div class="error">❌ Erreur réseau : ' + error.message + '</div>';
            }
          });
        </script>
      </body>
      </html>
    `;
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }
}
import { Injectable, UnauthorizedException, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { OrganisationsService } from '../organisations/organisations.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { TimeRange } from '../analytics/dto/analytics.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/users/users.entity';
import { CreateUserDto } from '../users/dto';
import { randomBytes } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserLevel } from '../learning/entities/user-level.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private organisationsService: OrganisationsService,
    private analyticsService: AnalyticsService,
    private jwtService: JwtService,
    @InjectRepository(UserLevel)
    private userLevelRepository: Repository<UserLevel>,
  ) {}

  // Stockage temporaire des tokens de réinitialisation (en production, utiliser Redis ou base de données)
  private resetTokens = new Map<string, { email: string; expiresAt: Date }>();

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && await bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: Partial<User>) {
    // Initialiser le niveau utilisateur s'il n'existe pas (première connexion)
    if (user.users_id) {
      await this.initializeUserLevelIfNeeded(user.users_id);
    }
    
    const payload = { email: user.email, sub: user.users_id, role: user.role };
    const access_token = this.jwtService.sign(payload, { expiresIn: '1h' });
    const refresh_token = this.generateRefreshToken(payload);
    // Optionally, persist refresh token hash if you want server-side revocation (not implemented here)
    return {
      access_token,
      refresh_token,
    };
  }

  generateRefreshToken(payload: any): string {
    return this.jwtService.sign(payload, { expiresIn: '7d' });
  }

  async refresh(refreshToken: string) {
    try {
      const decoded = this.jwtService.verify(refreshToken);
      const payload = { email: decoded.email, sub: decoded.sub, role: decoded.role };
      const access_token = this.jwtService.sign(payload, { expiresIn: '1h' });
      const new_refresh_token = this.generateRefreshToken(payload);
      return { access_token, refresh_token: new_refresh_token };
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: number) {
    // En production, on pourrait invalider le token côté serveur
    // Pour l'instant, on retourne juste un message de succès
    // Le client devra supprimer le token côté frontend
    return { message: 'Déconnexion réussie' };
  }

  /**
   * Initialise le niveau utilisateur s'il n'existe pas (première connexion)
   */
  private async initializeUserLevelIfNeeded(userId: number): Promise<void> {
    const existingLevel = await this.userLevelRepository.findOne({
      where: { utilisateur: { users_id: userId } }
    });

    if (!existingLevel) {
      console.log(`Initialisation du niveau utilisateur pour user ${userId} (première connexion)`);
      
      const userLevel = this.userLevelRepository.create({
        utilisateur: { users_id: userId } as any,
        niveau_actuel: 'debutant' as any,
        points_totaux: 0,
        points_niveau_actuel: 0,
        points_pour_niveau_suivant: 100,
        quiz_reussis: 0,
        modules_completes: 0,
        simulations_reussies: 0,
        jours_consecutifs: 0,
        derniere_activite: new Date()
      });

      await this.userLevelRepository.save(userLevel);
      console.log(`Niveau utilisateur initialisé pour user ${userId}`);
    }
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Vérifier l'ancien mot de passe
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Mot de passe actuel incorrect');
    }

    // Vérifier que le nouveau mot de passe est différent
    if (currentPassword === newPassword) {
      throw new BadRequestException('Le nouveau mot de passe doit être différent de l\'actuel');
    }

    // Valider la complexité du nouveau mot de passe
    if (!this.validatePassword(newPassword)) {
      throw new BadRequestException('Le nouveau mot de passe doit contenir au moins 8 caractères, incluant majuscules, minuscules, chiffres et caractères spéciaux');
    }

    // Hasher et sauvegarder le nouveau mot de passe
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedNewPassword;
    await this.usersService.usersRepositoryInstance.save(user);

    return { message: 'Mot de passe changé avec succès' };
  }

  async resetPasswordRequest(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Pour des raisons de sécurité, on ne révèle pas si l'email existe ou non
      return { message: 'Si cet email existe dans notre base de données, un lien de réinitialisation a été envoyé' };
    }

    // Générer un token de réinitialisation
    const resetToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 heure

    // Stocker le token (en production, utiliser Redis ou base de données)
    this.resetTokens.set(resetToken, { email, expiresAt });

    // En production, envoyer un email avec le lien de réinitialisation
    // Pour l'instant, on retourne le token (à des fins de test)
    return { 
      message: 'Lien de réinitialisation envoyé par email',
      resetToken, // À supprimer en production
      expiresAt 
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenData = this.resetTokens.get(token);
    if (!tokenData) {
      throw new BadRequestException('Token de réinitialisation invalide');
    }

    if (new Date() > tokenData.expiresAt) {
      this.resetTokens.delete(token);
      throw new BadRequestException('Token de réinitialisation expiré');
    }

    const user = await this.usersService.findByEmail(tokenData.email);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Valider la complexité du nouveau mot de passe
    if (!this.validatePassword(newPassword)) {
      throw new BadRequestException('Le mot de passe doit contenir au moins 8 caractères, incluant majuscules, minuscules, chiffres et caractères spéciaux');
    }

    // Hasher et sauvegarder le nouveau mot de passe
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedNewPassword;
    await this.usersService.usersRepositoryInstance.save(user);

    // Supprimer le token utilisé
    this.resetTokens.delete(token);

    return { message: 'Mot de passe réinitialisé avec succès' };
  }

  async register(email: string, password: string, nom: string, prenom: string, age: number, role: string ='user', code_langue: string = 'FR', organisation_id?: string) {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Validate password complexity
    if (!this.validatePassword(password)) {
      throw new ConflictException('Password must contain at least 8 characters, including uppercase, lowercase, numbers, and special characters');
    }

    // Check if trying to create a superadmin and if one already exists
    if (role === 'superadmin') {
      const existingSuperadmin = await this.usersService.findByRole('superadmin');
      if (existingSuperadmin && existingSuperadmin.length > 0) {
        throw new ConflictException('A superadmin already exists. Only one superadmin is allowed in the system.');
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12); // Increased salt rounds for better security
    
    const createUserDto: CreateUserDto = {
      email,
      password: hashedPassword,
      nom,
      prenom,
      role: role as any,
      age,
      code_langue,
      organisation_id
    };

    const user = await this.usersService.createWithOrganisation(createUserDto);
    
    // Return user without password for security
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  private validatePassword(password: string): boolean {
    if (password.length < 8) return false;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
  }

  async getProfile(userId: number) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    return await this.usersService.getUserInfos(userId);
  }

  async getDashboard(userId: number) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    switch (user.role) {
      case 'user':
        // Pour un utilisateur normal, retourner son profil via getUserInfos
        return await this.usersService.getUserInfos(userId);
      
      case 'admin':
        // Pour un admin, retourner les stats de son organisation
        if (!user.organisation?.organisation_id) {
          throw new BadRequestException('Admin sans organisation assignée');
        }
        return await this.organisationsService.getOrganisationStats(user.organisation.organisation_id);
      
      case 'superadmin':
        // Pour un superadmin, retourner le dashboard global
        try {
          return await this.analyticsService.getGlobalDashboard({ timeRange: TimeRange.MONTH });
        } catch (error) {
          console.error('Erreur lors de la récupération du dashboard global:', error);
          throw new BadRequestException('Erreur lors de la récupération du tableau de bord');
        }
      
      default:
        throw new BadRequestException('Rôle utilisateur non reconnu');
    }
  }
}
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

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private organisationsService: OrganisationsService,
    private analyticsService: AnalyticsService,
    private jwtService: JwtService,
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
    const payload = { email: user.email, sub: user.users_id, role: user.role };
    const access_token = this.jwtService.sign(payload, { expiresIn: '1h' });
    const refresh_token = this.generateRefreshToken(payload);
    return {
      access_token,
      refresh_token,
    };
  }

  generateRefreshToken(payload: any): string {
    return this.jwtService.sign(payload, { expiresIn: '7d' });
  }

  async logout(userId: number) {
    // En production, on pourrait invalider le token côté serveur
    // Pour l'instant, on retourne juste un message de succès
    // Le client devra supprimer le token côté frontend
    return { message: 'Déconnexion réussie' };
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
    // Récupérer l'utilisateur avec organisation
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    // Récupérer les parcours de l'organisation
    const organisationId = user.organisation?.organisation_id;
    let totalParcours = 0;
    let organisationParcours = [];
    if (organisationId) {
      const organisationParcours = await this.usersService.usersRepositoryInstance.manager
        .getRepository('OrganisationLearningPath')
        .find({
          where: { organisation: { organisation_id: organisationId }, actif: true },
          relations: ['parcours'],
        });
      totalParcours = organisationParcours.length;
    }

    // Récupérer les progressions de l'utilisateur
    const progressions = await this.usersService.usersRepositoryInstance.manager
      .getRepository('Progress')
      .find({
        where: { utilisateur: { users_id: userId } },
        relations: ['module', 'module.parcours'],
      });

    // Calculer les parcours terminés
    const parcoursTerminés = new Set<number>();
    let tempsParcours: { [key: number]: number } = {};
    for (const prog of progressions) {
      if (prog.statut === 'completed' && prog.module?.parcours?.parcours_id) {
        parcoursTerminés.add(prog.module.parcours.parcours_id);
      }
      if (prog.module?.parcours?.parcours_id) {
        tempsParcours[prog.module.parcours.parcours_id] = (tempsParcours[prog.module.parcours.parcours_id] || 0) + (prog.temps_passe || 0);
      }
    }

    // Nombre de certificats
    const certificats = await this.usersService.usersRepositoryInstance.manager
      .getRepository('Certification')
      .count({ where: { utilisateur: { users_id: userId } }});

    return {
      user: {
        users_id: user.users_id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
        age: user.age,
        code_langue: user.code_langue,
        organisation: user.organisation,
      },
      stats: {
        total_parcours: totalParcours,
        parcours_termines: parcoursTerminés.size,
        temps_parcours: tempsParcours,
        certificats,
      }
    };
  }

  async getMyInfos(userId: number) {
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
        return await this.analyticsService.getGlobalDashboard({ timeRange: TimeRange.MONTH });
      
      default:
        throw new BadRequestException('Rôle utilisateur non reconnu');
    }
  }
}
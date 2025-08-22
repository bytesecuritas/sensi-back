import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/users/users.entity';
import { CreateUserDto } from '../users/dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

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

  async register(email: string, password: string, nom: string, prenom: string, age: number, role: string ='user', code_langue: string = 'FR', organisation_id?: string) {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
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
    
    // retourne le user créer avec le mot de passe non hashé
    return {
      ...user,
      password: password,
    };
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
}
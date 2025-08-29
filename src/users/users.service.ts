import { Injectable, NotFoundException, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './users.entity';
import { Organisation } from '../organisations/organisations.entity';
import { CreateUserDto } from './dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Organisation)
    private organisationsRepository: Repository<Organisation>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findById(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { users_id: id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    // un user peut voir son propre profil
    if (user.role === 'user') {
      if (user.users_id !== id) {
        throw new UnauthorizedException('You cannot view this profile');
      }
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findByEmailOrFail(email: string): Promise<User> {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    return user;
  }

  async findByRole(role: string): Promise<User[]> {
    return this.usersRepository.find({ where: { role } });
  }



  async createWithOrganisation(createUserDto: CreateUserDto): Promise<User> {
    // Check if user with email already exists
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Vérifier l'organisation si l'utilisateur n'est pas superadmin
    let organisation: Organisation | null = null;
    if (createUserDto.role !== 'superadmin') {
      if (!createUserDto.organisation_id) {
        throw new BadRequestException('Organisation is required for non-superadmin users');
      }

      organisation = await this.organisationsRepository.findOne({
        where: { organisation_id: parseInt(createUserDto.organisation_id) }
      });

      if (!organisation) {
        throw new BadRequestException(`Organisation with ID ${createUserDto.organisation_id} not found`);
      }
    }

    const user = this.usersRepository.create({
      email: createUserDto.email,
      password: createUserDto.password,
      nom: createUserDto.nom,
      prenom: createUserDto.prenom,
      role: createUserDto.role,
      age: createUserDto.age,
      code_langue: createUserDto.code_langue || 'FR',
      organisation: organisation || undefined
    });

    return this.usersRepository.save(user);
  }

  async update(id: number, userData: Partial<User>): Promise<User> {
    // un user peut mettre à jour son propre profil
    const user = await this.findById(id);
    if (user.role === 'user') {
      if (user.users_id !== id) {
        throw new UnauthorizedException('You cannot update this profile');
      }
    }
    await this.usersRepository.update(id, userData);
    return this.findById(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  // Exposer les repositories pour AuthService
  get usersRepositoryInstance() {
    return this.usersRepository;
  }
  get organisationsRepositoryInstance() {
    return this.organisationsRepository;
  }

  // Changer le mot de passe
  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await this.findById(userId);
    
    // Vérifier l'ancien mot de passe
    const bcrypt = require('bcrypt');
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('Mot de passe actuel incorrect');
    }

    // Hasher le nouveau mot de passe
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    
    // Mettre à jour le mot de passe
    await this.usersRepository.update(userId, { password: hashedNewPassword });
    
    return true;
  }

  // Obtenir les informations détaillées d'un utilisateur
  async getUserInfos(userId: number) {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Récupérer les progressions de l'utilisateur
    const progressions = await this.usersRepository.manager
      .getRepository('Progress')
      .find({
        where: { utilisateur: { users_id: userId } },
        relations: ['module', 'module.parcours'],
      });

    // Calculer les statistiques
    const totalModules = progressions.length;
    const modulesTermines = progressions.filter(p => p.statut === 'termine').length;
    const tempsTotal = progressions.reduce((total, p) => total + (p.temps_passe || 0), 0);
    const scoreMoyen = progressions.length > 0 
      ? progressions.reduce((total, p) => total + (p.score || 0), 0) / progressions.length 
      : 0;

    // Récupérer les certificats
    const certificats = await this.usersRepository.manager
      .getRepository('Certification')
      .find({
        where: { utilisateur: { users_id: userId } },
        relations: ['parcours'],
      });

    // Statistiques par parcours
    const statsParcours = {};
    for (const prog of progressions) {
      if (prog.module?.parcours) {
        const parcoursId = prog.module.parcours.parcours_id;
        if (!statsParcours[parcoursId]) {
          statsParcours[parcoursId] = {
            titre: prog.module.parcours.titre,
            modules_completes: 0,
            temps_total: 0,
            score_moyen: 0,
            progression: 0
          };
        }
        
        if (prog.statut === 'termine') {
          statsParcours[parcoursId].modules_completes++;
        }
        statsParcours[parcoursId].temps_total += prog.temps_passe || 0;
        statsParcours[parcoursId].score_moyen += prog.score || 0;
      }
    }

    // Calculer les moyennes par parcours
    Object.values(statsParcours).forEach((parcours: any) => {
      if (parcours.modules_completes > 0) {
        parcours.score_moyen = parcours.score_moyen / parcours.modules_completes;
      }
    });

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
      statistiques: {
        total_modules: totalModules,
        modules_termines: modulesTermines,
        taux_completion: totalModules > 0 ? (modulesTermines / totalModules * 100).toFixed(2) : 0,
        temps_total: tempsTotal,
        score_moyen: scoreMoyen.toFixed(2),
        nombre_certificats: certificats.length,
      },
      parcours: statsParcours,
      certificats: certificats.map(cert => ({
        certification_id: cert.certification_id,
        titre: cert.titre,
        type: cert.type,
        date_obtention: cert.date_obtention,
        parcours: cert.parcours?.titre
      }))
    };
  }

}
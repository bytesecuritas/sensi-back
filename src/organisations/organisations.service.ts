import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organisation, OrganisationType } from './organisations.entity';
import { CreateOrganisationDto, UpdateOrganisationDto } from './dto';
import { User } from '../users/users.entity';

@Injectable()
export class OrganisationsService {
  constructor(
    @InjectRepository(Organisation)
    private organisationsRepository: Repository<Organisation>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createOrganisationDto: CreateOrganisationDto): Promise<Organisation> {
    const organisation = this.organisationsRepository.create(createOrganisationDto);
    return await this.organisationsRepository.save(organisation);
  }

  async findAll(): Promise<Organisation[]> {
    return await this.organisationsRepository.find({
      relations: ['utilisateurs'],
    });
  }

  async findOne(id: number): Promise<Organisation> {
    const organisation = await this.organisationsRepository.findOne({
      where: { organisation_id: id },
      relations: ['utilisateurs'],
    });

    if (!organisation) {
      throw new NotFoundException(`Organisation avec l'ID ${id} non trouvée`);
    }

    return organisation;
  }

  async update(id: number, updateOrganisationDto: UpdateOrganisationDto): Promise<Organisation> {
    const organisation = await this.findOne(id);
    
    // Vérifier qu'il y a au moins un admin dans l'organisation
    if (updateOrganisationDto.nom || updateOrganisationDto.type || updateOrganisationDto.code_pays) {
      await this.validateOrganisationHasAdmin(id);
    }

    Object.assign(organisation, updateOrganisationDto);
    return await this.organisationsRepository.save(organisation);
  }

  async remove(id: number): Promise<void> {
    const organisation = await this.findOne(id);
    
    // Vérifier qu'il n'y a pas d'utilisateurs dans l'organisation
    const userCount = await this.usersRepository.count({
      where: { organisation: { organisation_id: id } }
    });

    if (userCount > 0) {
      throw new BadRequestException(
        `Impossible de supprimer l'organisation ${id} car elle contient ${userCount} utilisateur(s)`
      );
    }

    await this.organisationsRepository.remove(organisation);
  }



  async removeUserFromOrganisation(organisationId: number, userId: number): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { users_id: userId },
      relations: ['organisation']
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur ${userId} non trouvé`);
    }

    if (!user.organisation || user.organisation.organisation_id !== organisationId) {
      throw new NotFoundException(`Utilisateur ${userId} non trouvé dans l'organisation ${organisationId}`);
    }

    // Vérifier qu'il reste au moins un admin dans l'organisation
    const adminCount = await this.usersRepository.count({
      where: { 
        organisation: { organisation_id: organisationId },
        role: 'admin'
      }
    });

    if (user.role === 'admin' && adminCount <= 1) {
      throw new BadRequestException(
        'Impossible de retirer cet utilisateur car il est le seul admin de l\'organisation'
      );
    }

    user.organisation = undefined as any;
    await this.usersRepository.save(user);
  }

  async getOrganisationUsers(organisationId: number): Promise<User[]> {
    await this.findOne(organisationId); // Vérifier que l'organisation existe
    
    return await this.usersRepository.find({
      where: { organisation: { organisation_id: organisationId } },
      select: ['users_id', 'email', 'nom', 'prenom', 'role', 'age', 'code_langue', 'date_creation']
    });
  }

  async validateOrganisationHasAdmin(organisationId: number): Promise<void> {
    const adminCount = await this.usersRepository.count({
      where: { 
        organisation: { organisation_id: organisationId },
        role: 'admin'
      }
    });

    if (adminCount === 0) {
      throw new BadRequestException(
        'Une organisation doit avoir au moins un administrateur'
      );
    }
  }

  async getOrganisationStats(organisationId: number): Promise<any> {
    const organisation = await this.findOne(organisationId);
    
    const [totalUsers, adminCount, userCount] = await Promise.all([
      this.usersRepository.count({ where: { organisation: { organisation_id: organisationId } } }),
      this.usersRepository.count({ where: { organisation: { organisation_id: organisationId }, role: 'admin' } }),
      this.usersRepository.count({ where: { organisation: { organisation_id: organisationId }, role: 'user' } })
    ]);

    return {
      organisation_id: organisation.organisation_id,
      nom: organisation.nom,
      type: organisation.type,
      code_pays: organisation.code_pays,
      date_creation: organisation.date_creation,
      stats: {
        total_users: totalUsers,
        admins: adminCount,
        users: userCount
      }
    };
  }
}

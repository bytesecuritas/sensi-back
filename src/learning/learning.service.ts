import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LearningPath } from './entities/learning-path.entity';
import { LearningModule } from './entities/learning-module.entity';
import { MediaContent } from './entities/media-content.entity';
import { Certification } from './entities/certification.entity';
import { Progress } from './entities/progress.entity';
import { OrganisationLearningPath } from './entities/organisation-learning-path.entity';
import { User } from '../users/users.entity';
import { Organisation } from '../organisations/organisations.entity';

@Injectable()
export class LearningService {
  constructor(
    @InjectRepository(LearningPath)
    private learningPathRepository: Repository<LearningPath>,
    @InjectRepository(LearningModule)
    private learningModuleRepository: Repository<LearningModule>,
    @InjectRepository(MediaContent)
    private mediaContentRepository: Repository<MediaContent>,
    @InjectRepository(Certification)
    private certificationRepository: Repository<Certification>,
    @InjectRepository(Progress)
    private progressRepository: Repository<Progress>,
    @InjectRepository(OrganisationLearningPath)
    private organisationLearningPathRepository: Repository<OrganisationLearningPath>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Organisation)
    private organisationRepository: Repository<Organisation>,
  ) {}

  // Méthodes pour les parcours d'apprentissage
  async createLearningPath(learningPathData: Partial<LearningPath>): Promise<LearningPath> {
    const learningPath = this.learningPathRepository.create(learningPathData);
    return await this.learningPathRepository.save(learningPath);
  }

  async getAllLearningPaths(): Promise<LearningPath[]> {
    return await this.learningPathRepository.find({
      relations: ['modules', 'organisationParcours'],
    });
  }

  async getLearningPathById(id: number): Promise<LearningPath> {
    const learningPath = await this.learningPathRepository.findOne({
      where: { parcours_id: id },
      relations: ['modules', 'modules.contenus_media', 'organisationParcours'],
    });
    if (!learningPath) {
      throw new NotFoundException(`Parcours d'apprentissage avec l'ID ${id} non trouvé`);
    }
    return learningPath;
  }

  // Méthodes pour les modules d'apprentissage
  async createLearningModule(moduleData: Partial<LearningModule>): Promise<LearningModule> {
    const module = this.learningModuleRepository.create(moduleData);
    return await this.learningModuleRepository.save(module);
  }

  async getModulesByLearningPath(parcoursId: number): Promise<LearningModule[]> {
    return await this.learningModuleRepository.find({
      where: { parcours_id: parcoursId },
      relations: ['contenus_media'],
    });
  }

  // Méthodes pour les contenus médias
  async createMediaContent(mediaData: Partial<MediaContent>): Promise<MediaContent> {
    const media = this.mediaContentRepository.create(mediaData);
    return await this.mediaContentRepository.save(media);
  }

  async getMediaContentByModule(moduleId: number): Promise<MediaContent[]> {
    return await this.mediaContentRepository.find({
      where: { module_id: moduleId },
    });
  }

  // Méthodes pour les progressions
  async createProgress(progressData: Partial<Progress>): Promise<Progress> {
    const progress = this.progressRepository.create(progressData);
    return await this.progressRepository.save(progress);
  }

  async updateProgress(id: number, progressData: Partial<Progress>): Promise<Progress> {
    await this.progressRepository.update(id, progressData);
    return await this.progressRepository.findOne({ where: { progression_id: id } });
  }

  async getUserProgress(userId: number): Promise<Progress[]> {
    return await this.progressRepository.find({
      where: { utilisateur_id: userId },
      relations: ['module', 'module.parcours'],
    });
  }

  async getModuleProgress(userId: number, moduleId: number): Promise<Progress> {
    return await this.progressRepository.findOne({
      where: { utilisateur_id: userId, module_id: moduleId },
    });
  }

  // Méthodes pour les certifications
  async createCertification(certificationData: Partial<Certification>): Promise<Certification> {
    const certification = this.certificationRepository.create(certificationData);
    return await this.certificationRepository.save(certification);
  }

  async getUserCertifications(userId: number): Promise<Certification[]> {
    return await this.certificationRepository.find({
      where: { utilisateur_id: userId },
      relations: ['parcours'],
    });
  }

  // Méthodes pour la gestion des parcours par organisation
  async addLearningPathToOrganisation(
    organisationId: number,
    parcoursId: number,
  ): Promise<OrganisationLearningPath> {
    // Vérifier que l'organisation existe
    const organisation = await this.organisationRepository.findOne({
      where: { organisation_id: organisationId },
    });
    if (!organisation) {
      throw new NotFoundException(`Organisation avec l'ID ${organisationId} non trouvée`);
    }

    // Vérifier que le parcours existe
    const parcours = await this.learningPathRepository.findOne({
      where: { parcours_id: parcoursId },
    });
    if (!parcours) {
      throw new NotFoundException(`Parcours avec l'ID ${parcoursId} non trouvé`);
    }

    // Vérifier si l'association existe déjà
    const existingAssociation = await this.organisationLearningPathRepository.findOne({
      where: { organisation_id: organisationId, parcours_id: parcoursId },
    });

    if (existingAssociation) {
      throw new ForbiddenException('Ce parcours est déjà associé à cette organisation');
    }

    const association = this.organisationLearningPathRepository.create({
      organisation_id: organisationId,
      parcours_id: parcoursId,
    });

    return await this.organisationLearningPathRepository.save(association);
  }

  async removeLearningPathFromOrganisation(
    organisationId: number,
    parcoursId: number,
  ): Promise<void> {
    const association = await this.organisationLearningPathRepository.findOne({
      where: { organisation_id: organisationId, parcours_id: parcoursId },
    });

    if (!association) {
      throw new NotFoundException('Association non trouvée');
    }

    await this.organisationLearningPathRepository.remove(association);
  }

  async getOrganisationLearningPaths(organisationId: number): Promise<LearningPath[]> {
    const associations = await this.organisationLearningPathRepository.find({
      where: { organisation_id: organisationId, actif: true },
      relations: ['parcours', 'parcours.modules'],
    });

    return associations.map(association => association.parcours);
  }

  // Méthode pour obtenir les parcours disponibles pour un utilisateur
  async getUserAvailableLearningPaths(userId: number): Promise<LearningPath[]> {
    const user = await this.userRepository.findOne({
      where: { users_id: userId },
      relations: ['organisation'],
    });

    if (!user || !user.organisation) {
      throw new NotFoundException('Utilisateur ou organisation non trouvé');
    }

    return await this.getOrganisationLearningPaths(user.organisation.organisation_id);
  }

  // Méthode pour vérifier si un utilisateur a accès à un parcours
  async checkUserAccessToLearningPath(userId: number, parcoursId: number): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { users_id: userId },
      relations: ['organisation'],
    });

    if (!user || !user.organisation) {
      return false;
    }

    const association = await this.organisationLearningPathRepository.findOne({
      where: {
        organisation_id: user.organisation.organisation_id,
        parcours_id: parcoursId,
        actif: true,
      },
    });

    return !!association;
  }
}

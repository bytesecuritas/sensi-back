import { Injectable, NotFoundException, ForbiddenException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LearningPath } from './entities/learning-path.entity';
import { LearningPathModule } from './entities/learning-module.entity';
import { MediaContent } from './entities/media-content.entity';
import { Progress } from './entities/progress.entity';
import { Certification } from './entities/certification.entity';
import { OrganisationLearningPath } from './entities/organisation-learning-path.entity';
import { CreateMediaContentDto } from './dto/create-media-content.dto';
import { CreateLearningModuleDto } from './dto/create-learning-module.dto';
import * as fs from 'fs';
import * as path from 'path';
import { User } from '../users/users.entity';
import { Organisation } from '../organisations/organisations.entity';
import { ProgressStatus } from './entities/progress.entity';


@Injectable()
export class LearningService {
  private readonly logger = new Logger(LearningService.name);
  private readonly tempDir = path.join(process.cwd(), 'ressource/temp');
  
  constructor(
    @InjectRepository(LearningPath)
    private learningPathRepository: Repository<LearningPath>,
    @InjectRepository(LearningPathModule)
    private learningModuleRepository: Repository<LearningPathModule>,
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

  // Supprimer un parcours (et ses modules + médias associés)
  async deleteLearningPath(id: number): Promise<void> {
    const parcours = await this.learningPathRepository.findOne({
      where: { parcours_id: id },
      relations: ['modules', 'modules.contenus_media'],
    });
    if (!parcours) throw new NotFoundException(`Parcours avec l'ID ${id} non trouvé`);

    // Supprimer les médias associés à chaque module
    for (const module of parcours.modules) {
      for (const media of module.contenus_media) {
        await this.deleteMediaContent(media.media_id);
      }
      await this.deleteLearningModule(module.module_id, false); // false: ne pas supprimer les médias (déjà fait)
    }
    await this.learningPathRepository.remove(parcours);
  }

  // Méthodes pour les modules d'apprentissage
  async createLearningModule(moduleData: CreateLearningModuleDto): Promise<LearningPathModule> {
    // Si parcours_id est fourni, récupérer le parcours correspondant
    if (moduleData.parcours_id && typeof moduleData.parcours_id === 'number') {
      const parcoursId = moduleData.parcours_id;
      const learningPath = await this.learningPathRepository.findOne({ where: { parcours_id: parcoursId } });
      if (!learningPath) {
        throw new NotFoundException(`Parcours avec l'ID ${parcoursId} non trouvé`);
      }
      const {parcours_id, ...moduleDataWidhoutPourcourId} = moduleData;
      const moduleToCreate = {
        ...moduleDataWidhoutPourcourId,
        parcours: learningPath
      }
      const module = this.learningModuleRepository.create(moduleToCreate);
      return await this.learningModuleRepository.save(module)
    }
    else{
      throw new NotFoundException(`Vous ne pouvez pas créer un module sans l'associer à un parcours.`);
    }
  }

  // Mettre à jour un module
  async updateLearningModule(id: number, moduleData: Partial<LearningPathModule>): Promise<LearningPathModule> {
    const module = await this.learningModuleRepository.findOne({ where: { module_id: id } });
    if (!module) throw new NotFoundException(`Module avec l'ID ${id} non trouvé`);
    Object.assign(module, moduleData);
    return await this.learningModuleRepository.save(module);
  }

  // Supprimer un module (et ses médias associés)
  async deleteLearningModule(id: number, deleteMedia = true): Promise<void> {
    const module = await this.learningModuleRepository.findOne({
      where: { module_id: id },
      relations: ['contenus_media'],
    });
    if (!module) throw new NotFoundException(`Module avec l'ID ${id} non trouvé`);
    if (deleteMedia) {
      for (const media of module.contenus_media) {
        await this.deleteMediaContent(media.media_id);
      }
    }
    await this.learningModuleRepository.remove(module);
  }

  async getModulesByLearningPath(parcoursId: number): Promise<LearningPathModule[]> {
    return await this.learningModuleRepository.find({
      where: { parcours: { parcours_id: parcoursId } },
      relations: ['contenus_media', 'parcours'],
    });
  }

  async getModuleById(moduleId: number): Promise<LearningPathModule> {
    const module = await this.learningModuleRepository.findOne({ where: { module_id: moduleId } });
    if (!module) {
      throw new NotFoundException(`Module with ID ${moduleId} not found`);
    }
    return module;
  }

  async createMediaContent(mediaData: CreateMediaContentDto): Promise<MediaContent> {
     // Log pour debug
    this.logger.log(`Received module_id: ${mediaData.module_id}`);
    this.logger.log(`Type of module_id: ${typeof mediaData.module_id}`);
    
    if (typeof mediaData.module_id !== 'number') {
      this.logger.warn(`module_id is not a number, attempting conversion: ${mediaData.module_id}`);
      
      const moduleId = Number(mediaData.module_id);
      
      if (isNaN(moduleId)) {
        this.logger.error(`Failed to convert module_id to number: ${mediaData.module_id}`);
        throw new BadRequestException('module_id must be a valid number');
      }
      
      mediaData.module_id = moduleId;
      this.logger.log(`Converted module_id to: ${mediaData.module_id}`);
    }
    const module = await this.getModuleById(mediaData.module_id);
    const { module_id, ...mediaDataWithoutModuleId } = mediaData;
    const mediaToCreate = {
      ...mediaDataWithoutModuleId,
      module,
    };
    const media = this.mediaContentRepository.create(mediaToCreate);
    return await this.mediaContentRepository.save(media);
  }

  async getMediaContentByModule(moduleId: number): Promise<MediaContent[]> {
    return await this.mediaContentRepository.find({
      where: { module: { module_id: moduleId } },
      relations: ['module'],
    });
  }

  async updateMediaContent(id: number, mediaData: Partial<CreateMediaContentDto>): Promise<MediaContent> {
    const media = await this.mediaContentRepository.findOne({ where: { media_id: id }, relations: ['module'] });
    if (!media) {
      throw new NotFoundException(`Media content with ID ${id} not found`);
    }

    if (mediaData.module_id && mediaData.module_id !== media.module.module_id) {
      const module = await this.getModuleById(mediaData.module_id);
      media.module = module;
    }

    Object.assign(media, mediaData);
    return await this.mediaContentRepository.save(media);
  }

  // Supprimer un média (et son fichier associé)
  async deleteMediaContent(id: number): Promise<void> {
    const media = await this.mediaContentRepository.findOne({ where: { media_id: id } });
    if (!media) throw new NotFoundException(`Media avec l'ID ${id} non trouvé`);
    // Supprimer le fichier physique si présent
    if (media.chemin_stockage) {
      const filePath = path.resolve(media.chemin_stockage);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          // Ignore file deletion error
        }
      }
    }
    await this.mediaContentRepository.remove(media);
  }

  async cleanTempFiles(): Promise<void> {
    try {
      if (!fs.existsSync(this.tempDir)) {
        this.logger.log('Temporary directory does not exist, no cleanup needed');
        return;
      }

      const files = fs.readdirSync(this.tempDir);
      const now = Date.now();
      const maxAge = 60 * 60 * 1000; // 1 hour in milliseconds

      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        const stats = fs.statSync(filePath);
        const fileAge = now - stats.mtimeMs;

        if (fileAge > maxAge && stats.isFile()) {
          fs.unlinkSync(filePath);
          this.logger.log(`Deleted temporary file: ${file}`);
        }
      }
      this.logger.log('Temporary files cleanup completed');
    } catch (error) {
      this.logger.error(`Error during temp files cleanup: ${error.message}`);
    }
  }

  // Méthodes pour les progressions
  async createProgress(progressData: Partial<Progress>): Promise<Progress> {
    // Si les IDs sont fournis, récupérer les entités correspondantes
    let user;
    let module;
    if (progressData.utilisateur && typeof progressData.utilisateur === 'number') {
      const userId = progressData.utilisateur;
      user = await this.userRepository.findOne({ where: { users_id: userId }, relations: ['organisation'] });
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      progressData.utilisateur = user;
    }
    
    if (progressData.module && typeof progressData.module === 'number') {
      const moduleId = progressData.module;
      module = await this.learningModuleRepository.findOne({ where: { module_id: moduleId }, relations: ['parcours'] });
      if (!module) {
        throw new NotFoundException(`Module with ID ${moduleId} not found`);
      }
      progressData.module = module;
    }
    // Vérification d'accès : le module doit appartenir à un parcours accessible par l'organisation de l'utilisateur
    if (user && module) {
      const organisationId = user.organisation?.organisation_id;
      const parcoursId = module.parcours?.parcours_id;
      if (!organisationId || !parcoursId) {
        throw new ForbiddenException('Utilisateur ou module non lié à une organisation ou un parcours.');
      }
      const association = await this.organisationLearningPathRepository.findOne({
        where: {
          organisation: { organisation_id: organisationId },
          parcours: { parcours_id: parcoursId },
          actif: true,
        },
      });
      if (!association) {
        throw new ForbiddenException('Ce module n\'est pas accessible pour l\'organisation de l\'utilisateur.');
      }
    }
    const progress = this.progressRepository.create(progressData);
    return await this.progressRepository.save(progress);
  }

  async updateProgress(id: number, progressData: Partial<Progress>): Promise<Progress> {
    const progress = await this.progressRepository.findOne({ 
      where: { progression_id: id },
      relations: ['utilisateur', 'module', 'module.parcours', 'utilisateur.organisation']
    });

    if (!progress) {
      throw new NotFoundException(`La progression d'id ${id} introuvable!`);
    }

    Object.assign(progress, progressData);
    return await this.progressRepository.save(progress);
  }

  async getUserProgress(userId: number): Promise<Progress[]> {
    return await this.progressRepository.find({
      where: { utilisateur: { users_id: userId } },
      relations: ['utilisateur', 'module', 'module.parcours'],
    });
  }

  async getModuleProgress(userId: number, moduleId: number): Promise<Progress> {
    const progress = await this.progressRepository.findOne({
      where: { 
        utilisateur: { users_id: userId }, 
        module: { module_id: moduleId } 
      },
      relations: ['utilisateur', 'module'],
    })

    if(!progress){
      throw new NotFoundException(`La progression de l'utilisateur ${userId} pour le module ${moduleId} n'existe pas!`)
    }
    return progress;
  }

  // Méthodes pour les certifications
  async createCertification(certificationData: Partial<Certification>): Promise<Certification> {
    // Si les IDs sont fournis, récupérer les entités correspondantes
    if (certificationData.utilisateur && typeof certificationData.utilisateur === 'number') {
      const userId = certificationData.utilisateur;
      const user = await this.userRepository.findOne({ where: { users_id: userId } });
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      certificationData.utilisateur = user;
    }
    
    if (certificationData.parcours && typeof certificationData.parcours === 'number') {
      const parcoursId = certificationData.parcours;
      const learningPath = await this.learningPathRepository.findOne({ where: { parcours_id: parcoursId } });
      if (!learningPath) {
        throw new NotFoundException(`Learning path with ID ${parcoursId} not found`);
      }
      certificationData.parcours = learningPath;
    }
    
    const certification = this.certificationRepository.create(certificationData);
    return await this.certificationRepository.save(certification);
  }

  async getUserCertifications(userId: number): Promise<Certification[]> {
    return await this.certificationRepository.find({
      where: { utilisateur: { users_id: userId } },
      relations: ['utilisateur', 'parcours'],
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
      where: { 
        organisation: { organisation_id: organisationId }, 
        parcours: { parcours_id: parcoursId } 
      },
      relations: ['organisation', 'parcours'],
    });

    if (existingAssociation) {
      throw new ForbiddenException('Ce parcours est déjà associé à cette organisation');
    }

    const association = this.organisationLearningPathRepository.create({
      organisation: organisation,
      parcours: parcours,
    });

    return await this.organisationLearningPathRepository.save(association);
  }

  async removeLearningPathFromOrganisation(
    organisationId: number,
    parcoursId: number,
  ): Promise<void> {
    const association = await this.organisationLearningPathRepository.findOne({
      where: { 
        organisation: { organisation_id: organisationId }, 
        parcours: { parcours_id: parcoursId } 
      },
      relations: ['organisation', 'parcours'],
    });

    if (!association) {
      throw new NotFoundException('Association non trouvée');
    }

    await this.organisationLearningPathRepository.remove(association);
  }

  async getOrganisationLearningPaths(organisationId: number): Promise<LearningPath[]> {
    const associations = await this.organisationLearningPathRepository.find({
      where: { organisation: { organisation_id: organisationId }, actif: true },
      relations: ['organisation', 'parcours', 'parcours.modules'],
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
        organisation: { organisation_id: user.organisation.organisation_id },
        parcours: { parcours_id: parcoursId },
        actif: true,
      },
      relations: ['organisation', 'parcours'],
    });

    return !!association;
  }

}


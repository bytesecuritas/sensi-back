import { Injectable, NotFoundException, ForbiddenException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LearningPath } from './entities/learning-path.entity';
import { LearningPathModule } from './entities/learning-module.entity';
import { MediaContent } from './entities/media-content.entity';
import { Progress } from './entities/progress.entity';
import { Certification } from './entities/certification.entity';
import { OrganisationLearningPath } from './entities/organisation-learning-path.entity';
import { Quiz } from './entities/quiz.entity';
import { Question } from './entities/question.entity';
import { Reponse } from './entities/reponse.entity';
import { QuizResponse } from './entities/quiz-response.entity';
import { CreateMediaContentDto } from './dto/create-media-content.dto';
import { CreateLearningModuleDto } from './dto/create-learning-module.dto';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { SubmitQuizResponseDto } from './dto/submit-quiz-response.dto';
import * as fs from 'fs';
import * as path from 'path';
import { User } from '../users/users.entity';
import { Organisation } from '../organisations/organisations.entity';
import { ProgressStatus } from './entities/progress.entity';
import { GamificationService } from './gamification.service';


@Injectable()
export class LearningService {
  private readonly logger = new Logger(LearningService.name);
  private readonly tempDir = path.join(process.cwd(), 'ressources/temp');
  
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
    @InjectRepository(Quiz)
    private quizRepository: Repository<Quiz>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(Reponse)
    private reponseRepository: Repository<Reponse>,
    @InjectRepository(QuizResponse)
    private quizResponseRepository: Repository<QuizResponse>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Organisation)
    private organisationRepository: Repository<Organisation>,
    private gamificationService: GamificationService,
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

  async getAllLearningModules(): Promise<LearningPathModule[]> {
    return await this.learningModuleRepository.find({
      relations: ['contenus_media', 'parcours'],
    });
  }

  async getLearningModuleById(id: number): Promise<LearningPathModule> {
    const module = await this.learningModuleRepository.findOne({
      where: { module_id: id },
      relations: ['contenus_media', 'parcours'],
    });
    if (!module) {
      throw new NotFoundException(`Module avec l'ID ${id} non trouvé`);
    }
    return module;
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

  async getMediaContentById(mediaId: number): Promise<MediaContent> {
    const media = await this.mediaContentRepository.findOne({
      where: { media_id: mediaId },
      relations: ['module'],
    });
    if (!media) {
      throw new NotFoundException(`Contenu média avec l'ID ${mediaId} non trouvé`);
    }
    return media;
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
    let parcours;
    if (progressData.utilisateur && typeof progressData.utilisateur === 'number') {
      const userId = progressData.utilisateur;
      user = await this.userRepository.findOne({ where: { users_id: userId }, relations: ['organisation'] });
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      progressData.utilisateur = user;
    }
    
    if (progressData.parcours && typeof progressData.parcours === 'number') {
      const parcoursId = progressData.parcours;
      parcours = await this.learningPathRepository.findOne({ where: { parcours_id: parcoursId } });
      if (!parcours) {
        throw new NotFoundException(`Parcours with ID ${parcoursId} not found`);
      }
      progressData.parcours = parcours;
    }
    
    // Vérification d'accès : le parcours doit être accessible par l'organisation de l'utilisateur
    if (user && parcours) {
      const organisationId = user.organisation?.organisation_id;
      const parcoursId = parcours.parcours_id;
      if (!organisationId || !parcoursId) {
        throw new ForbiddenException('Utilisateur ou parcours non lié à une organisation.');
      }
      const association = await this.organisationLearningPathRepository.findOne({
        where: {
          organisation: { organisation_id: organisationId },
          parcours: { parcours_id: parcoursId },
          actif: true,
        },
      });
      if (!association) {
        throw new ForbiddenException('Ce parcours n\'est pas accessible pour l\'organisation de l\'utilisateur.');
      }
    }
    const progress = this.progressRepository.create(progressData);
    return await this.progressRepository.save(progress);
  }

  async updateProgress(id: number, progressData: Partial<Progress>): Promise<Progress> {
    const progress = await this.progressRepository.findOne({ 
      where: { progression_id: id },
      relations: ['utilisateur', 'parcours', 'utilisateur.organisation']
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
      relations: ['utilisateur', 'parcours'],
    });
  }

  async getParcoursProgress(userId: number, parcoursId: number): Promise<Progress> {
    const progress = await this.progressRepository.findOne({
      where: { 
        utilisateur: { users_id: userId }, 
        parcours: { parcours_id: parcoursId } 
      },
      relations: ['utilisateur', 'parcours'],
    })

    if(!progress){
      throw new NotFoundException(`La progression de l'utilisateur ${userId} pour le parcours ${parcoursId} n'existe pas!`)
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

  async updateOrganisationLearningPath(
    organisationId: number,
    parcoursId: number,
    updateData: any
  ): Promise<OrganisationLearningPath> {
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

    Object.assign(association, updateData);
    return await this.organisationLearningPathRepository.save(association);
  }

  // ==================== MÉTHODES POUR LES QUIZ ====================

  // Créer un quiz pour un module
  async createQuiz(moduleId: number, quizData: CreateQuizDto): Promise<Quiz> {
    const module = await this.learningModuleRepository.findOne({
      where: { module_id: moduleId },
      relations: ['parcours']
    });

    if (!module) {
      throw new NotFoundException(`Module avec l'ID ${moduleId} non trouvé`);
    }

    // Créer le quiz sans les questions d'abord
    const { questions, ...quizDataWithoutQuestions } = quizData;
    const quiz = this.quizRepository.create({
      ...quizDataWithoutQuestions,
      module: module,
      type_quiz: 'module' as any, // Par défaut, un quiz créé pour un module est de type module
      validation_100_pourcent: true // Les quiz de module nécessitent 100% de réussite
    });

    const savedQuiz = await this.quizRepository.save(quiz);

    // Créer les questions et réponses avec calcul automatique des points
    if (questions && questions.length > 0) {
      // Calculer les points par question (100 points répartis équitablement)
      const pointsParQuestion = 100 / questions.length;
      
      for (const questionData of questions) {
        const { reponses, ...questionDataWithoutReponses } = questionData;
        
        const question = this.questionRepository.create({
          ...questionDataWithoutReponses,
          points: pointsParQuestion, // Points calculés automatiquement
          quiz: savedQuiz,
          type_question: questionDataWithoutReponses.type_question as any,
        });

        const savedQuestion = await this.questionRepository.save(question);

        // Créer les réponses pour cette question
        if (reponses && reponses.length > 0) {
          for (const reponseData of reponses) {
            const reponse = this.reponseRepository.create({
              ...reponseData,
              question: savedQuestion
            } as any);
            await this.reponseRepository.save(reponse);
          }
        }
      }
    }

    // Retourner le quiz avec toutes ses relations
    return await this.getQuizById(savedQuiz.quiz_id);
  }

  // Créer un quiz final pour un parcours
  async createParcoursFinalQuiz(parcoursId: number, quizData: CreateQuizDto): Promise<Quiz> {
    const parcours = await this.learningPathRepository.findOne({
      where: { parcours_id: parcoursId }
    });

    if (!parcours) {
      throw new NotFoundException(`Parcours avec l'ID ${parcoursId} non trouvé`);
    }

    // Créer le quiz sans les questions d'abord
    const { questions, ...quizDataWithoutQuestions } = quizData;
    const quiz = this.quizRepository.create({
      ...quizDataWithoutQuestions,
      parcours: parcours,
      type_quiz: 'parcours_final' as any,
      validation_100_pourcent: false, // Les quiz finaux de parcours nécessitent 80% de réussite
      score_minimum_pour_reussite: 80.0 // Score minimum de 80% pour les quiz finaux
    });

    const savedQuiz = await this.quizRepository.save(quiz);

    // Créer les questions et réponses avec calcul automatique des points
    if (questions && questions.length > 0) {
      // Calculer les points par question (100 points répartis équitablement)
      const pointsParQuestion = 100 / questions.length;
      
      for (const questionData of questions) {
        const { reponses, ...questionDataWithoutReponses } = questionData;
        
        const question = this.questionRepository.create({
          ...questionDataWithoutReponses,
          points: pointsParQuestion, // Points calculés automatiquement
          quiz: savedQuiz,
          type_question: questionDataWithoutReponses.type_question as any,
        });

        const savedQuestion = await this.questionRepository.save(question);

        // Créer les réponses pour cette question
        if (reponses && reponses.length > 0) {
          for (const reponseData of reponses) {
            const reponse = this.reponseRepository.create({
              ...reponseData,
              question: savedQuestion
            } as any);
            await this.reponseRepository.save(reponse);
          }
        }
      }
    }

    // Retourner le quiz avec toutes ses relations
    return await this.getQuizById(savedQuiz.quiz_id);
  }

  // Obtenir tous les quiz d'un module
  async getModuleQuizzes(moduleId: number): Promise<Quiz[]> {
    return await this.quizRepository.find({
      where: { module: { module_id: moduleId }, actif: true },
      relations: ['questions', 'questions.reponses'],
      order: { ordre: 'ASC' }
    });
  }

  // Obtenir tous les quiz finaux d'un parcours
  async getParcoursFinalQuizzes(parcoursId: number): Promise<Quiz[]> {
    return await this.quizRepository.find({
      where: { parcours: { parcours_id: parcoursId }, type_quiz: 'parcours_final' as any, actif: true },
      relations: ['questions', 'questions.reponses'],
      order: { ordre: 'ASC' }
    });
  }

  // Obtenir un quiz spécifique avec ses questions
  async getQuizById(quizId: number, userId?: number): Promise<Quiz> {
    const quiz = await this.quizRepository.findOne({
      where: { quiz_id: quizId, actif: true },
      relations: ['questions', 'questions.reponses', 'module', 'module.parcours', 'parcours']
    });

    if (!quiz) {
      throw new NotFoundException(`Quiz avec l'ID ${quizId} non trouvé`);
    }

    // Si un userId est fourni, vérifier l'accès au quiz
    if (userId) {
      await this.validateQuizAccess(userId, quiz);
    }

    // Trier les questions et réponses manuellement
    if (quiz.questions) {
      quiz.questions.sort((a, b) => a.ordre - b.ordre);
      quiz.questions.forEach(question => {
        if (question.reponses) {
          question.reponses.sort((a, b) => a.ordre - b.ordre);
        }
      });
    }

    return quiz;
  }

  // Soumettre les réponses d'un utilisateur à un quiz
  async submitQuizResponse(userId: number, quizId: number, responseData: SubmitQuizResponseDto): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { users_id: userId }
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const quiz = await this.getQuizById(quizId);
    if (!quiz) {
      throw new NotFoundException('Quiz non trouvé');
    }

    // Vérifier si l'utilisateur peut accéder à ce quiz (ordre et prérequis)
    await this.validateQuizAccess(userId, quiz);

    // Vérifier s'il existe déjà des réponses et gérer les règles de reprise
    const previousResponses = await this.quizResponseRepository.find({
      where: {
        utilisateur: { users_id: userId },
        quiz: { quiz_id: quizId }
      },
      relations: ['quiz', 'question']
    });

    // Calculer le score précédent si des réponses existent
    let previousTotalObtained = 0;
    if (previousResponses.length > 0) {
      previousTotalObtained = previousResponses.reduce((sum, r) => sum + Number(r.points_obtenus || 0), 0);
    }
    const totalPointsQuizBefore = (quiz.questions || []).reduce((sum, quest) => sum + Number(quest.points || 0), 0);
    const previousScoreFinal = totalPointsQuizBefore > 0 ? (previousTotalObtained / totalPointsQuizBefore) * 100 : 0;

    if (quiz.type_quiz === 'module') {
      // Reprise possible uniquement si le quiz module n'a pas été validé (score < 100)
      if (previousResponses.length > 0 && previousScoreFinal >= 100) {
        throw new BadRequestException('Ce quiz de module a déjà été validé à 100%');
      }
    } else if (quiz.type_quiz === 'parcours_final') {
      // Le quiz final peut toujours être repris; la mise à jour se fait seulement si nouveau score > ancien
      // Pas de blocage ici
    }

    let totalScore = 0;
    let totalPoints = 0;
    const responses: QuizResponse[] = [];

    // Traiter chaque réponse
    for (const reponse of responseData.reponses) {
      const question = quiz.questions.find(q => q.question_id === reponse.question_id);
      if (!question) {
        throw new BadRequestException(`Question avec l'ID ${reponse.question_id} non trouvée`);
      }

      let isCorrect = false;
      let pointsObtenus = 0;
      const questionPoints = Number(question.points || 0);

      // Évaluer la réponse selon le type de question
      switch (question.type_question) {
        case 'choix_unique':
          if (reponse.reponse_id) {
            const reponseChoisie = question.reponses.find(r => r.reponse_id === reponse.reponse_id);
            isCorrect = reponseChoisie?.est_correcte || false;
            pointsObtenus = isCorrect ? questionPoints : 0;
          }
          break;

        case 'choix_multiple':
          if (reponse.reponses_multiple && reponse.reponses_multiple.length > 0) {
            const reponsesCorrectes = question.reponses.filter(r => r.est_correcte);
            const reponsesChoisies = question.reponses.filter(r => 
              reponse.reponses_multiple!.includes(r.reponse_id)
            );
            
            // Calculer le score pour les questions à choix multiples
            const correctesChoisies = reponsesChoisies.filter(r => r.est_correcte).length;
            const incorrectesChoisies = reponsesChoisies.filter(r => !r.est_correcte).length;
            const correctesNonChoisies = reponsesCorrectes.length - correctesChoisies;
            
            if (incorrectesChoisies === 0 && correctesNonChoisies === 0) {
              isCorrect = true;
              pointsObtenus = questionPoints;
            } else if (correctesChoisies > 0) {
              // Score partiel
              const scorePartiel = (correctesChoisies / reponsesCorrectes.length) * questionPoints;
              pointsObtenus = Math.max(0, scorePartiel - (incorrectesChoisies * 0.5));
            }
          }
          break;

        case 'vrai_faux':
          if (reponse.reponse_vrai_faux !== undefined) {
            const reponseCorrecte = question.reponses.find(r => r.est_correcte);
            isCorrect = reponseCorrecte?.texte.toLowerCase() === (reponse.reponse_vrai_faux ? 'vrai' : 'faux');
            pointsObtenus = isCorrect ? questionPoints : 0;
          }
          break;

        case 'texte_libre':
          // Validation par correspondance avec les réponses correctes
          if (reponse.reponse_texte && reponse.reponse_texte.trim().length > 0) {
            const answer = reponse.reponse_texte.toLowerCase();
            const correctAnswers = question.reponses.filter(r => r.est_correcte);
            if (correctAnswers.length > 0) {
              // Vérifier si la réponse contient au moins un terme correct
              const matched = correctAnswers.some(r => 
                answer.includes(r.texte.toLowerCase())
              );
              isCorrect = matched;
            } else {
              // fallback: toute réponse non vide est acceptée
              isCorrect = true;
            }
          } else {
            isCorrect = false;
          }
          pointsObtenus = isCorrect ? questionPoints : 0;
          break;
      }

      // Construire la réponse (sauvegarde différée selon règles de reprise)
      const quizResponse = this.quizResponseRepository.create({
        utilisateur: user,
        quiz: quiz,
        question: question,
        reponse_choisie: reponse.reponse_id ? question.reponses.find(r => r.reponse_id === reponse.reponse_id) || null : null,
        reponse_texte: reponse.reponse_texte,
        est_correcte: isCorrect,
        points_obtenus: pointsObtenus,
        temps_reponse_secondes: responseData.temps_total_secondes || 0
      } as any);
      responses.push(quizResponse as any);

      totalScore += Number(pointsObtenus || 0);
      totalPoints += questionPoints;
    }

    // Calculer le nouveau score final en pourcentage
    const newScoreFinal = totalPoints > 0 ? (totalScore / totalPoints) * 100 : 0;
    
    // Logique de validation selon le type de quiz
    let isReussi = false;
    
    if (quiz.type_quiz === 'module') {
      // Pour les quiz de module : validation 100% obligatoire
      isReussi = newScoreFinal >= 100;
    } else if (quiz.type_quiz === 'parcours_final') {
      // Pour les quiz finaux de parcours : validation à 80%
      isReussi = newScoreFinal >= 80;
    } else {
      // Fallback sur l'ancienne logique
      isReussi = newScoreFinal >= quiz.score_minimum_pour_reussite;
    }

    // Décider de la persistance et du score effectif selon les règles de reprise
    let scoreUpdated = false;
    let effectiveScoreFinal = previousScoreFinal;

    if (quiz.type_quiz === 'module') {
      // Si reprise autorisée, remplacer les réponses existantes
      if (previousResponses.length > 0) {
        await this.quizResponseRepository.remove(previousResponses);
      }
      for (const r of responses) {
        await this.quizResponseRepository.save(r);
      }
      scoreUpdated = true;
      effectiveScoreFinal = newScoreFinal;
    } else if (quiz.type_quiz === 'parcours_final') {
      // Mettre à jour uniquement si le nouveau score est supérieur
      if (previousResponses.length === 0 || newScoreFinal > previousScoreFinal) {
        if (previousResponses.length > 0) {
          await this.quizResponseRepository.remove(previousResponses);
        }
        for (const r of responses) {
          await this.quizResponseRepository.save(r);
        }
        scoreUpdated = true;
        effectiveScoreFinal = newScoreFinal;
      } else {
        scoreUpdated = false;
        effectiveScoreFinal = previousScoreFinal;
      }
    } else {
      // Fallback: conserver la meilleure des deux tentatives
      if (previousResponses.length === 0 || newScoreFinal >= previousScoreFinal) {
        if (previousResponses.length > 0) {
          await this.quizResponseRepository.remove(previousResponses);
        }
        for (const r of responses) {
          await this.quizResponseRepository.save(r);
        }
        scoreUpdated = true;
        effectiveScoreFinal = newScoreFinal;
      }
    }

    // Mettre à jour la progression selon le type de quiz en utilisant le score effectif
    if (quiz.type_quiz === 'module' && quiz.module && quiz.module.parcours) {
      console.log(`Mise à jour progression pour user ${userId}, parcours ${quiz.module.parcours.parcours_id}, score ${effectiveScoreFinal}, réussi: ${isReussi}`);
      await this.updateParcoursProgressFromModule(userId, quiz.module.parcours.parcours_id, effectiveScoreFinal, isReussi);
      // Incrémenter le nombre de tentatives de quiz pour ce parcours
      try {
        const progression = await this.progressRepository.findOne({
          where: {
            utilisateur: { users_id: userId },
            parcours: { parcours_id: quiz.module.parcours.parcours_id }
          }
        });
        if (progression) {
          progression.tentatives_quiz = (progression.tentatives_quiz || 0) + 1;
          await this.progressRepository.save(progression);
        }
      } catch (e) {
        this.logger.warn(`Impossible d'incrémenter tentatives_quiz: ${e.message}`);
      }
    } else if (quiz.type_quiz === 'parcours_final' && quiz.parcours) {
      console.log(`Mise à jour certification pour user ${userId}, parcours ${quiz.parcours.parcours_id}, score ${effectiveScoreFinal}, réussi: ${isReussi}`);
      await this.updateCertification(userId, quiz.parcours.parcours_id, effectiveScoreFinal, isReussi);
      // Incrémenter le nombre de tentatives de quiz pour ce parcours
      try {
        const progression = await this.progressRepository.findOne({
          where: {
            utilisateur: { users_id: userId },
            parcours: { parcours_id: quiz.parcours.parcours_id }
          }
        });
        if (progression) {
          progression.tentatives_quiz = (progression.tentatives_quiz || 0) + 1;
          await this.progressRepository.save(progression);
        }
      } catch (e) {
        this.logger.warn(`Impossible d'incrémenter tentatives_quiz (final): ${e.message}`);
      }
    } else {
      console.log(`Quiz type: ${quiz.type_quiz}, module: ${quiz.module?.module_id}, parcours: ${quiz.parcours?.parcours_id}`);
    }

    // Gamification automatique
    try {
      // Si le quiz de module est réussi, attribuer des points liés au quiz proportionnels au score
      if (scoreUpdated && isReussi && quiz.type_quiz === 'module' && quiz.module) {
        await this.gamificationService.addQuizSuccessPoints(userId, quiz.module.module_id, Math.round(effectiveScoreFinal));
      }

      // Si c'est un quiz de module, vérifier si tous les quiz du module sont réussis (100%) pour attribuer les points de fin de module
      if (quiz.type_quiz === 'module' && quiz.module) {
        const moduleId = quiz.module.module_id;
        const quizzes = await this.getModuleQuizzes(moduleId);
        const responsesForModule = await this.quizResponseRepository.find({
          where: {
            utilisateur: { users_id: userId },
            quiz: { module: { module_id: moduleId }, type_quiz: 'module' as any },
          },
          relations: ['quiz', 'quiz.questions'],
        });

        // Calculer le pourcentage obtenu par l'utilisateur par quiz (somme des points de réponses / total des points du quiz)
        const scoreByQuiz = new Map<number, number>();
        for (const q of quizzes) {
          const reps = responsesForModule.filter(r => r.quiz.quiz_id === q.quiz_id);
          const totalObtained = reps.reduce((sum, r) => sum + Number(r.points_obtenus || 0), 0);
          const totalPointsQuiz = (q.questions || []).reduce((sum, quest) => sum + Number(quest.points || 0), 0);
          const pct = totalPointsQuiz > 0 ? (totalObtained / totalPointsQuiz) * 100 : 0;
          scoreByQuiz.set(q.quiz_id, pct);
        }

        // Tous les quiz du module doivent être à 100%
        const allQuizzesCompleted = quizzes.length > 0 && quizzes.every(q => (scoreByQuiz.get(q.quiz_id) || 0) >= 100);
        if (allQuizzesCompleted) {
          await this.gamificationService.addModuleCompletionPoints(userId, moduleId, Math.round(effectiveScoreFinal));
        }
      }
    } catch (e) {
      this.logger.warn(`Gamification non appliquée pour user ${userId}, quiz ${quizId}: ${e.message}`);
    }

    return {
      quiz_id: quizId,
      score_final: effectiveScoreFinal,
      new_score_final: newScoreFinal,
      previous_score_final: previousResponses.length > 0 ? previousScoreFinal : null,
      score_updated: scoreUpdated,
      points_obtenus: totalScore,
      points_totaux: totalPoints,
      reussi: isReussi,
      score_minimum: quiz.score_minimum_pour_reussite,
      reponses: responses.map(r => ({
        question_id: r.question.question_id,
        est_correcte: r.est_correcte,
        points_obtenus: r.points_obtenus
      }))
    };
  }

  // Mettre à jour la progression d'un parcours basée sur les quiz de module
  private async updateParcoursProgressFromModule(userId: number, parcoursId: number, scoreQuiz: number, isReussi: boolean): Promise<void> {
    console.log(`updateParcoursProgressFromModule: userId=${userId}, parcoursId=${parcoursId}, scoreQuiz=${scoreQuiz}, isReussi=${isReussi}`);
    
    // Obtenir le parcours avec tous ses modules
    const parcours = await this.learningPathRepository.findOne({
      where: { parcours_id: parcoursId },
      relations: ['modules', 'modules.quiz', 'modules.quiz.questions']
    });

    if (!parcours) {
      console.log(`Parcours ${parcoursId} non trouvé`);
      return;
    }

    console.log(`Parcours trouvé: ${parcours.titre}, modules: ${parcours.modules?.length || 0}`);

    // Obtenir toutes les réponses de l'utilisateur pour ce parcours (quiz de module uniquement)
    const reponsesUtilisateur = await this.quizResponseRepository.find({
      where: { 
        utilisateur: { users_id: userId },
        quiz: { module: { parcours: { parcours_id: parcoursId } }, type_quiz: 'module' as any }
      },
      relations: ['quiz', 'quiz.module']
    });

    // Calculer la progression basée sur les quiz de module réussis
    let modulesCompletes = 0;
    let totalModules = 0;

    for (const module of parcours.modules) {
      if (module.quiz && module.quiz.length > 0) {
        totalModules++;
        
        // Vérifier si tous les quiz du module sont réussis
        const quizDuModule = module.quiz;
        let moduleReussi = true;

        for (const quiz of quizDuModule) {
          const reponsesQuiz = reponsesUtilisateur.filter(r => r.quiz.quiz_id === quiz.quiz_id);
          
          if (reponsesQuiz.length === 0) {
            moduleReussi = false;
            break;
          }

          // Vérifier si le quiz est réussi (100% pour les quiz de module)
          const scoreQuiz = reponsesQuiz.reduce((sum, r) => sum + Number(r.points_obtenus || 0), 0);
          const pointsTotauxQuiz = quiz.questions ? quiz.questions.reduce((sum, q) => sum + Number(q.points || 0), 0) : 0;
          const pourcentageQuiz = pointsTotauxQuiz > 0 ? (scoreQuiz / pointsTotauxQuiz) * 100 : 0;
          
          if (pourcentageQuiz < 100) {
            moduleReussi = false;
            break;
          }
        }

        if (moduleReussi) {
          modulesCompletes++;
        }
      }
    }

    // Calculer la progression finale (pourcentage de modules complétés)
    const progressionFinale = totalModules > 0 ? (modulesCompletes / totalModules) * 100 : 0;
    console.log(`Progression calculée: ${modulesCompletes}/${totalModules} modules complétés = ${progressionFinale}%`);

    // Mettre à jour ou créer la progression du parcours
    let progression = await this.progressRepository.findOne({
      where: { 
        utilisateur: { users_id: userId },
        parcours: { parcours_id: parcoursId }
      }
    });

    console.log(`Progression existante trouvée: ${!!progression}`);

    if (!progression) {
      progression = this.progressRepository.create({
        utilisateur: { users_id: userId } as User,
        parcours: { parcours_id: parcoursId } as LearningPath,
        score: progressionFinale,
        statut: progressionFinale >= 100 ? ProgressStatus.TERMINE : ProgressStatus.EN_COURS,
        quiz_reussi: progressionFinale >= 100
      });
    } else {
      progression.score = progressionFinale;
      progression.statut = progressionFinale >= 100 ? ProgressStatus.TERMINE : ProgressStatus.EN_COURS;
      progression.quiz_reussi = progressionFinale >= 100;
    }

    await this.progressRepository.save(progression);
    console.log(`Progression sauvegardée: score=${progression.score}, statut=${progression.statut}`);
  }

  /**
   * Valide si un utilisateur peut accéder à un quiz selon l'ordre et les prérequis
   */
  private async validateQuizAccess(userId: number, quiz: Quiz): Promise<void> {
    if (quiz.type_quiz === 'module' && quiz.module) {
      // Pour les quiz de module, vérifier l'ordre dans le module et les modules précédents
      await this.validateModuleQuizAccess(userId, quiz);
    } else if (quiz.type_quiz === 'parcours_final' && quiz.parcours) {
      // Pour les quiz finaux, vérifier que tous les modules du parcours sont complétés
      await this.validateParcoursFinalQuizAccess(userId, quiz);
    }
  }

  /**
   * Valide l'accès aux quiz de module selon l'ordre
   */
  private async validateModuleQuizAccess(userId: number, quiz: Quiz): Promise<void> {
    const module = quiz.module;
    const parcours = module.parcours;

    // 1. Vérifier que tous les modules précédents sont complétés
    const allModules = await this.learningPathRepository.findOne({
      where: { parcours_id: parcours.parcours_id },
      relations: ['modules', 'modules.quiz', 'modules.quiz.questions']
    });

    if (!allModules) {
      throw new NotFoundException('Parcours non trouvé');
    }

    // Trier les modules par ordre
    const sortedModules = allModules.modules.sort((a, b) => a.ordre - b.ordre);
    const currentModuleIndex = sortedModules.findIndex(m => m.module_id === module.module_id);

    // Vérifier que tous les modules précédents sont complétés (tous leurs quiz de module à 100%)
    for (let i = 0; i < currentModuleIndex; i++) {
      const previousModule = sortedModules[i];
      const completed = await this.isModuleCompleted(userId, previousModule.module_id);
      if (!completed) {
        throw new BadRequestException(`Vous devez compléter le module "${previousModule.titre}" (tous ses quiz à 100%) avant d'accéder à ce quiz`);
      }
    }

    // 2. Vérifier l'ordre des quiz dans le module actuel
    const moduleQuizzes = await this.getModuleQuizzes(module.module_id);
    const currentQuizIndex = moduleQuizzes.findIndex(q => q.quiz_id === quiz.quiz_id);

    // Vérifier que tous les quiz précédents dans le module sont complétés
    for (let i = 0; i < currentQuizIndex; i++) {
      const previousQuiz = moduleQuizzes[i];
      const quizResponse = await this.quizResponseRepository.findOne({
        where: {
          utilisateur: { users_id: userId },
          quiz: { quiz_id: previousQuiz.quiz_id }
        },
        relations: ['quiz', 'quiz.questions']
      });

      if (!quizResponse) {
        throw new BadRequestException(`Vous devez compléter le quiz "${previousQuiz.titre}" avant d'accéder à ce quiz`);
      }

      // Vérifier que le quiz précédent est réussi à 100%
      const totalScore = await this.calculateQuizScore(userId, previousQuiz.quiz_id);
      const totalPoints = previousQuiz.questions.reduce((sum, q) => sum + (q.points || 0), 0);
      const scorePercentage = totalPoints > 0 ? (totalScore / totalPoints) * 100 : 0;

      if (scorePercentage < 100) {
        throw new BadRequestException(`Vous devez réussir le quiz "${previousQuiz.titre}" à 100% avant d'accéder à ce quiz`);
      }
    }
  }

  /**
   * Retourne true si un module est complété pour un utilisateur (tous ses quiz de type module à 100%).
   */
  private async isModuleCompleted(userId: number, moduleId: number): Promise<boolean> {
    const quizzes = await this.getModuleQuizzes(moduleId);
    if (!quizzes || quizzes.length === 0) {
      return false;
    }

    const responsesForModule = await this.quizResponseRepository.find({
      where: {
        utilisateur: { users_id: userId },
        quiz: { module: { module_id: moduleId }, type_quiz: 'module' as any },
      },
      relations: ['quiz', 'quiz.questions'],
    });

    for (const q of quizzes) {
      const reps = responsesForModule.filter(r => r.quiz.quiz_id === q.quiz_id);
      if (reps.length === 0) {
        return false;
      }
      const totalObtained = reps.reduce((sum, r) => sum + Number(r.points_obtenus || 0), 0);
      const totalPointsQuiz = (q.questions || []).reduce((sum, quest) => sum + Number(quest.points || 0), 0);
      const pct = totalPointsQuiz > 0 ? (totalObtained / totalPointsQuiz) * 100 : 0;
      if (pct < 100) {
        return false;
      }
    }

    return true;
  }

  /**
   * Valide l'accès aux quiz finaux de parcours
   */
  private async validateParcoursFinalQuizAccess(userId: number, quiz: Quiz): Promise<void> {
    const parcours = quiz.parcours;

    // Vérifier que tous les modules du parcours sont complétés
    const allModules = await this.learningPathRepository.findOne({
      where: { parcours_id: parcours.parcours_id },
      relations: ['modules']
    });

    if (!allModules) {
      throw new NotFoundException('Parcours non trouvé');
    }

    const progression = await this.progressRepository.findOne({
      where: {
        utilisateur: { users_id: userId },
        parcours: { parcours_id: parcours.parcours_id }
      }
    });

    if (!progression || progression.score < 100) {
      throw new BadRequestException('Vous devez compléter tous les modules du parcours avant d\'accéder au quiz final');
    }
  }

  /**
   * Calcule le score d'un quiz pour un utilisateur
   */
  private async calculateQuizScore(userId: number, quizId: number): Promise<number> {
    const responses = await this.quizResponseRepository.find({
      where: {
        utilisateur: { users_id: userId },
        quiz: { quiz_id: quizId }
      }
    });

    return responses.reduce((sum, r) => sum + (r.points_obtenus || 0), 0);
  }

  // Mettre à jour la certification basée sur le quiz final
  private async updateCertification(userId: number, parcoursId: number, scoreQuiz: number, isReussi: boolean): Promise<void> {
    // Obtenir la progression du parcours
    let progression = await this.progressRepository.findOne({
      where: { 
        utilisateur: { users_id: userId },
        parcours: { parcours_id: parcoursId }
      }
    });

    if (!progression) {
      // Si pas de progression, créer une progression vide
      progression = this.progressRepository.create({
        utilisateur: { users_id: userId } as User,
        parcours: { parcours_id: parcoursId } as LearningPath,
        score: 0,
        statut: ProgressStatus.NON_COMMENCE
      });
    }

    // Mettre à jour le statut de certification
    if (isReussi) {
      progression.certificat_obtenu = true;
      
      // Si le parcours est terminé (100%) et le quiz final réussi, le parcours est complètement terminé
      if (progression.score >= 100) {
        progression.statut = ProgressStatus.TERMINE;
      }
    }

    await this.progressRepository.save(progression);
  }

  // Obtenir les résultats d'un quiz pour un utilisateur
  async getQuizResults(userId: number, quizId: number): Promise<any> {
    const reponses = await this.quizResponseRepository.find({
      where: { 
        utilisateur: { users_id: userId },
        quiz: { quiz_id: quizId }
      },
      relations: ['question', 'question.reponses', 'reponse_choisie', 'quiz', 'quiz.questions']
    });

    if (reponses.length === 0) {
      throw new NotFoundException('Aucune réponse trouvée pour ce quiz');
    }

    const totalScore = reponses.reduce((sum, r) => sum + Number(r.points_obtenus || 0), 0);
    
    // Vérifier que le quiz et ses questions sont chargés
    const quiz = reponses[0].quiz;
    if (!quiz || !quiz.questions) {
      throw new NotFoundException('Quiz ou questions non trouvés');
    }
    
    const totalPoints = quiz.questions.reduce((sum, q) => sum + Number(q.points || 0), 0);
    const scoreFinal = totalPoints > 0 ? (totalScore / totalPoints) * 100 : 0;

    return {
      quiz_id: quizId,
      score_final: scoreFinal,
      points_obtenus: totalScore,
      points_totaux: totalPoints,
      reussi: scoreFinal >= reponses[0].quiz.score_minimum_pour_reussite,
      reponses: reponses.map(r => ({
        question_id: r.question.question_id,
        enonce: r.question.enonce,
        reponse_choisie: r.reponse_choisie?.texte || r.reponse_texte,
        reponse_correcte: r.question.reponses?.find(re => re.est_correcte)?.texte || 'Réponse non disponible',
        est_correcte: r.est_correcte,
        points_obtenus: r.points_obtenus,
        explication: r.question.explication
      }))
    };
  }

  // Supprimer un quiz
  async deleteQuiz(quizId: number): Promise<void> {
    const quiz = await this.quizRepository.findOne({
      where: { quiz_id: quizId }
    });

    if (!quiz) {
      throw new NotFoundException(`Quiz avec l'ID ${quizId} non trouvé`);
    }

    // Supprimer le quiz (les questions, réponses et réponses utilisateurs seront supprimées en cascade)
    await this.quizRepository.remove(quiz);
  }

}


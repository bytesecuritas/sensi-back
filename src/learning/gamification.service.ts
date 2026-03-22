import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThanOrEqual, Like, In } from 'typeorm';
import { User } from '../users/users.entity';
import { Badge, BadgeType, BadgeCategory } from './entities/badge.entity';
import { UserBadge } from './entities/user-badge.entity';
import { UserLevel, UserLevelEnum } from './entities/user-level.entity';
import { SimulationResponse, SimulationResponseStatus } from './entities/simulation-response.entity';
import { ChallengeParticipation } from './entities/challenge-participation.entity';
import { Progress, ProgressStatus } from './entities/progress.entity';
import { QuizResponse } from './entities/quiz-response.entity';
import { DashboardDto, UserLevelDto, InitBadgesDto, CreateBadgeDto, UpdateBadgeDto } from './dto/gamification.dto';
import { LearningPathModule } from './entities/learning-module.entity';
import { Simulation } from './entities/simulation.entity';
import { CertificateService } from './certificate.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  // Configuration des points pour différentes actions
  private readonly POINTS_CONFIG = {
    MODULE_COMPLETE: 50,
    QUIZ_SUCCESS: 25,
    SIMULATION_SUCCESS: 150,
    BADGE_OBTAINED: 25,
    CHALLENGE_COMPLETE: 100,
    DAILY_LOGIN: 5,
    CONSECUTIVE_DAYS: 10,
  };

  // Définition des badges par défaut
  private readonly DEFAULT_BADGES = [
    {
      nom: 'Premier Pas',
      description: 'Vous avez complété votre premier module de formation',
      type: BadgeType.BRONZE,
      categorie: BadgeCategory.PREMIER_PAS,
      points_requis: 0,
      points_attribues: 25,
      est_secret: false,
      conditions_obtention: 'Compléter un module de formation',
      icone_filename: 'premier_pas.svg'
    },
    {
      nom: 'Vigilant',
      description: 'Vous avez réussi votre première simulation de phishing',
      type: BadgeType.BRONZE,
      categorie: BadgeCategory.VIGILANCE,
      points_requis: 0,
      points_attribues: 25,
      est_secret: false,
      conditions_obtention: 'Réussir une simulation de phishing',
      icone_filename: 'vigilant.svg'
    },
    {
      nom: 'Quiz Parfait',
      description: 'Vous avez obtenu un score parfait à un quiz de parcours final',
      type: BadgeType.BRONZE,
      categorie: BadgeCategory.QUIZ,
      points_requis: 0,
      points_attribues: 50,
      est_secret: false,
      conditions_obtention: 'Obtenir 100% à un quiz de parcours final',
      icone_filename: 'quiz_parfait.svg'
    },
    {
      nom: 'Assidu',
      description: 'Vous vous êtes connecté 7 jours consécutifs',
      type: BadgeType.ARGENT,
      categorie: BadgeCategory.ASSIDUITE,
      points_requis: 100,
      points_attribues: 75,
      est_secret: false,
      conditions_obtention: 'Se connecter 7 jours consécutifs',
      icone_filename: 'assidu.svg'
    },
    {
      nom: 'Expert Phishing',
      description: 'Vous avez complété tous les modules sur le phishing',
      type: BadgeType.OR,
      categorie: BadgeCategory.EXPERT,
      points_requis: 300,
      points_attribues: 100,
      est_secret: false,
      conditions_obtention: 'Compléter tous les modules sur le phishing',
      icone_filename: 'expert_phishing.svg'
    },
    {
      nom: 'Défenseur Cyber',
      description: 'Vous avez réussi 10 simulations',
      type: BadgeType.OR,
      categorie: BadgeCategory.DEFENSEUR,
      points_requis: 500,
      points_attribues: 150,
      est_secret: false,
      conditions_obtention: 'Réussir 10 simulations',
      icone_filename: 'defenseur_cyber.svg'
    },
  ];

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Badge)
    private badgeRepository: Repository<Badge>,
    @InjectRepository(UserBadge)
    private userBadgeRepository: Repository<UserBadge>,
    @InjectRepository(UserLevel)
    private userLevelRepository: Repository<UserLevel>,
    @InjectRepository(SimulationResponse)
    private simulationResponseRepository: Repository<SimulationResponse>,
    @InjectRepository(ChallengeParticipation)
    private challengeParticipationRepository: Repository<ChallengeParticipation>,
    @InjectRepository(Progress)
    private progressRepository: Repository<Progress>,
    @InjectRepository(QuizResponse)
    private quizResponseRepository: Repository<QuizResponse>,
    @InjectRepository(LearningPathModule)
    private learningModuleRepository: Repository<LearningPathModule>,
    @InjectRepository(Simulation)
    private simulationRepository: Repository<Simulation>,
    private dataSource: DataSource,
    private certificateService: CertificateService,
  ) {}

  // Configuration des niveaux et points requis
  private readonly LEVEL_THRESHOLDS: Record<UserLevelEnum, number> = {
    [UserLevelEnum.DEBUTANT]: 0,
    [UserLevelEnum.INTERMEDIAIRE]: 200,
    [UserLevelEnum.AVANCE]: 500,
    [UserLevelEnum.EXPERT]: 1000,
    [UserLevelEnum.MAITRE]: 2000,
  };

  /**
   * Obtient le tableau de bord personnalisé pour un utilisateur
   */
  async getDashboard(userId: number): Promise<DashboardDto> {
    const user = await this.userRepository.findOne({
      where: { users_id: userId },
      relations: ['organisation', 'userLevel', 'userBadges', 'userBadges.badge'],
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Récupérer ou créer le niveau utilisateur
    let userLevel = user.userLevel;
    if (!userLevel) {
      userLevel = await this.createUserLevel(userId);
    }

    // Calculer les statistiques
    const stats = await this.calculateUserStats(userId);
    const classement = await this.getTeamRanking(userId);
    const badges = await this.getUserBadges(userId);
    const recommendations = await this.getModuleRecommendations(userId);

    return {
      userLevel: {
        niveau_actuel: userLevel.niveau_actuel,
        points_totaux: userLevel.points_totaux,
        points_niveau_actuel: userLevel.points_niveau_actuel,
        points_pour_niveau_suivant: userLevel.points_pour_niveau_suivant,
        modules_completes: stats.modules_completes,
        quiz_reussis: stats.quiz_reussis,
        simulations_reussies: stats.simulations_reussies,
        jours_consecutifs: userLevel.jours_consecutifs,
      },
      progression_globale: stats.progression_globale,
      classement_equipe: classement.position,
      total_utilisateurs: classement.total,
      badges_obtenus: badges.obtenus,
      badges_disponibles: badges.disponibles,
      modules_recommandes: recommendations,
      defis_actifs: await this.getActiveChallenges(userId),
      alertes_recentes: await this.getRecentAlerts(),
    };
  }

  /**
   * Attribue des points à un utilisateur
   * @param skipBadgeCheck - Si true, ne vérifie pas les badges (pour éviter la récursion)
   */
  async awardPoints(userId: number, points: number, reason: string, skipBadgeCheck: boolean = false): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Mettre à jour les points de l'utilisateur
      let userLevel = await this.userLevelRepository.findOne({
        where: { utilisateur: { users_id: userId } },
      });

      if (!userLevel) {
        userLevel = await this.createUserLevel(userId);
      }

      const oldPoints = userLevel.points_totaux;
      const newPoints = oldPoints + points;
      const oldLevel = userLevel.niveau_actuel;

      userLevel.points_totaux = newPoints;
      userLevel.points_niveau_actuel = newPoints - this.LEVEL_THRESHOLDS[oldLevel];
      userLevel.derniere_activite = new Date();

      // Vérifier si l'utilisateur a gagné un niveau
      const newLevel = this.calculateUserLevel(newPoints);
      if (newLevel !== oldLevel) {
        userLevel.niveau_actuel = newLevel;
        userLevel.points_niveau_actuel = newPoints - this.LEVEL_THRESHOLDS[newLevel];
        const nextThreshold = this.getNextLevelThreshold(newLevel);
        userLevel.points_pour_niveau_suivant = nextThreshold > 0 ? nextThreshold - newPoints : 0;
      } else {
        // Mise à jour des points pour le niveau suivant même si pas de changement de niveau
        const nextThreshold = this.getNextLevelThreshold(newLevel);
        userLevel.points_pour_niveau_suivant = nextThreshold > 0 ? nextThreshold - newPoints : 0;
      }

      await queryRunner.manager.save(UserLevel, userLevel);

      // Vérifier les badges débloqués (sauf si on vient d'attribuer un badge pour éviter la boucle)
      if (!skipBadgeCheck) {
        await this.checkAndAwardBadges(userId, newPoints, reason);
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Vérifie et attribue les badges appropriés
   */
  async checkAndAwardBadges(userId: number, totalPoints: number, reason: string): Promise<Badge[]> {
    const badges = await this.badgeRepository.find({
      where: { points_requis: LessThanOrEqual(totalPoints) },
    });

    const awardedBadges: Badge[] = [];
    const existingBadges = await this.userBadgeRepository.find({
      where: { utilisateur: { users_id: userId } },
      relations: ['badge'],
    });

    const existingBadgeIds = existingBadges.map(ub => ub.badge.badge_id);

    for (const badge of badges) {
      if (!existingBadgeIds.includes(badge.badge_id)) {
        // Vérifier les conditions spécifiques
        if (await this.checkBadgeConditions(userId, badge, reason)) {
          await this.awardBadge(userId, badge, reason);
          awardedBadges.push(badge);
        }
      }
    }

    return awardedBadges;
  }

  /**
   * Attribue un badge à un utilisateur
   */
  async awardBadge(userId: number, badge: Badge, context: string): Promise<void> {
    const userBadge = new UserBadge();
    userBadge.utilisateur = { users_id: userId } as User;
    userBadge.badge = badge;
    userBadge.date_obtention = new Date();
    userBadge.contexte_obtention = context;
    userBadge.points_gagnes = badge.points_attribues;

    await this.userBadgeRepository.save(userBadge);

    // Attribuer les points du badge (avec skipBadgeCheck=true pour éviter la boucle infinie)
    if (badge.points_attribues > 0) {
      await this.awardPoints(userId, badge.points_attribues, `Badge: ${badge.nom}`, true);
    }
  }

  /**
   * Calcule le niveau d'un utilisateur basé sur ses points
   */
  private calculateUserLevel(points: number): UserLevelEnum {
    if (points >= this.LEVEL_THRESHOLDS[UserLevelEnum.MAITRE]) {
      return UserLevelEnum.MAITRE;
    } else if (points >= this.LEVEL_THRESHOLDS[UserLevelEnum.EXPERT]) {
      return UserLevelEnum.EXPERT;
    } else if (points >= this.LEVEL_THRESHOLDS[UserLevelEnum.AVANCE]) {
      return UserLevelEnum.AVANCE;
    } else if (points >= this.LEVEL_THRESHOLDS[UserLevelEnum.INTERMEDIAIRE]) {
      return UserLevelEnum.INTERMEDIAIRE;
    } else {
      return UserLevelEnum.DEBUTANT;
    }
  }

  /**
   * Obtient le seuil de points pour le niveau suivant
   */
  private getNextLevelThreshold(currentLevel: UserLevelEnum): number {
    const levels = Object.values(UserLevelEnum);
    const currentIndex = levels.indexOf(currentLevel);
    
    if (currentIndex < levels.length - 1) {
      const nextLevel = levels[currentIndex + 1];
      return this.LEVEL_THRESHOLDS[nextLevel];
    }
    
    return 0; // Niveau maximum atteint
  }

  /**
   * Crée un niveau utilisateur initial
   */
  private async createUserLevel(userId: number): Promise<UserLevel> {
    const userLevel = new UserLevel();
    userLevel.utilisateur = { users_id: userId } as User;
    userLevel.niveau_actuel = UserLevelEnum.DEBUTANT;
    userLevel.points_totaux = 0;
    userLevel.points_niveau_actuel = 0;
    userLevel.points_pour_niveau_suivant = this.LEVEL_THRESHOLDS[UserLevelEnum.INTERMEDIAIRE];
    userLevel.modules_completes = 0;
    userLevel.quiz_reussis = 0;
    userLevel.simulations_reussies = 0;
    userLevel.jours_consecutifs = 0;
    userLevel.derniere_connexion = new Date();
    userLevel.derniere_activite = new Date();

    return await this.userLevelRepository.save(userLevel);
  }

  /**
   * Calcule les statistiques d'un utilisateur
   */
  private async calculateUserStats(userId: number): Promise<any> {
    const [modulesCompletes, simulationsReussies] = await Promise.all([
      this.progressRepository.count({
        where: {
          utilisateur: { users_id: userId },
          statut: ProgressStatus.TERMINE,
        },
      }),
      this.simulationResponseRepository.count({
        where: {
          utilisateur: { users_id: userId },
          statut: SimulationResponseStatus.REUSSIE,
        },
      }),
    ]);

    // Calculer les quiz réussis correctement (100% pour modules, 80% pour finaux)
    const [moduleQuizResponses, finalQuizResponses] = await Promise.all([
      this.quizResponseRepository.find({
        where: {
          utilisateur: { users_id: userId },
          quiz: { type_quiz: 'module' as any }
        },
        relations: ['quiz', 'quiz.questions'],
      }),
      this.quizResponseRepository.find({
        where: {
          utilisateur: { users_id: userId },
          quiz: { type_quiz: 'parcours_final' as any }
        },
        relations: ['quiz', 'quiz.questions'],
      })
    ]);

    let quizReussis = 0;
    
    // Compter les quiz de module (100% requis)
    const moduleQuizIds = [...new Set(moduleQuizResponses.map(qr => qr.quiz.quiz_id))];
    for (const quizId of moduleQuizIds) {
      const responsesForQuiz = moduleQuizResponses.filter(qr => qr.quiz.quiz_id === quizId);
      if (responsesForQuiz.length > 0) {
        const totalObtained = responsesForQuiz.reduce((sum, r) => sum + Number(r.points_obtenus || 0), 0);
        const totalPoints = responsesForQuiz[0].quiz.questions ? 
          responsesForQuiz[0].quiz.questions.reduce((sum, q) => sum + Number(q.points || 0), 0) : 0;
        const percentage = totalPoints > 0 ? (totalObtained / totalPoints) * 100 : 0;
        
        if (percentage >= 100) {
          quizReussis++;
        }
      }
    }
    
    // Compter les quiz finaux (80% requis)
    const finalQuizIds = [...new Set(finalQuizResponses.map(qr => qr.quiz.quiz_id))];
    for (const quizId of finalQuizIds) {
      const responsesForQuiz = finalQuizResponses.filter(qr => qr.quiz.quiz_id === quizId);
      if (responsesForQuiz.length > 0) {
        const totalObtained = responsesForQuiz.reduce((sum, r) => sum + Number(r.points_obtenus || 0), 0);
        const totalPoints = responsesForQuiz[0].quiz.questions ? 
          responsesForQuiz[0].quiz.questions.reduce((sum, q) => sum + Number(q.points || 0), 0) : 0;
        const percentage = totalPoints > 0 ? (totalObtained / totalPoints) * 100 : 0;
        const threshold = Number(responsesForQuiz[0].quiz.score_minimum_pour_reussite ?? 80);
        
        if (percentage >= threshold) {
          quizReussis++;
        }
      }
    }

    // Calculer la progression globale (basée sur les modules complétés)
    const totalModules = await this.progressRepository.count({
      where: { utilisateur: { users_id: userId } },
    });

    const progressionGlobale = totalModules > 0 ? (modulesCompletes / totalModules) * 100 : 0;

    return {
      modules_completes: modulesCompletes,
      quiz_reussis: quizReussis,
      simulations_reussies: simulationsReussies,
      progression_globale: Math.round(progressionGlobale),
    };
  }

  /**
   * Obtient le classement de l'équipe
   */
  private async getTeamRanking(userId: number): Promise<{ position: number; total: number }> {
    const user = await this.userRepository.findOne({
      where: { users_id: userId },
      relations: ['organisation'],
    });

    if (!user?.organisation) {
      return { position: 1, total: 1 };
    }

    const teamMembers = await this.userLevelRepository
      .createQueryBuilder('ul')
      .leftJoin('ul.utilisateur', 'u')
      .where('u.organisation.organisation_id = :orgId', { orgId: user.organisation.organisation_id })
      .orderBy('ul.points_totaux', 'DESC')
      .getMany();

    const userPosition = teamMembers.findIndex(member => member.utilisateur.users_id === userId) + 1;

    return {
      position: userPosition,
      total: teamMembers.length,
    };
  }

  /**
   * Obtient les badges d'un utilisateur
   */
  async getUserBadges(userId: number): Promise<{ obtenus: any[]; disponibles: any[] }> {
    const [obtenus, disponibles] = await Promise.all([
      this.userBadgeRepository.find({
        where: { utilisateur: { users_id: userId } },
        relations: ['badge'],
      }),
      this.badgeRepository.find({
        where: { est_secret: false },
      }),
    ]);

    return {
      obtenus: obtenus.map(ub => ({
        badge_id: ub.badge.badge_id,
        nom: ub.badge.nom,
        description: ub.badge.description,
        type: ub.badge.type,
        date_obtention: ub.date_obtention,
        points_gagnes: ub.points_gagnes,
      })),
      disponibles: disponibles.map(b => ({
        badge_id: b.badge_id,
        nom: b.nom,
        description: b.description,
        type: b.type,
        points_requis: b.points_requis,
        points_attribues: b.points_attribues,
      })),
    };
  }

  /**
   * Obtient les recommandations de modules
   */
  private async getModuleRecommendations(userId: number): Promise<any[]> {
    // Logique de recommandation basée sur le niveau et les modules complétés
    const userLevel = await this.userLevelRepository.findOne({
      where: { utilisateur: { users_id: userId } },
    });

    if (!userLevel) {
      return [];
    }

    // Modules recommandés selon le niveau
    const recommendations: any[] = [];
    
    if (userLevel.niveau_actuel === UserLevelEnum.DEBUTANT) {
      recommendations.push(
        { id: 1, titre: 'Reconnaître les Emails de Phishing', type: 'recommandé', points: 50 },
        { id: 2, titre: 'Gestion des Mots de Passe Sécurisés', type: 'recommandé', points: 50 },
        { id: 3, titre: 'Protection contre les Rançongiciels', type: 'optionnel', points: 75 }
      );
    } else if (userLevel.niveau_actuel === UserLevelEnum.INTERMEDIAIRE) {
      recommendations.push(
        { id: 4, titre: 'Sécurité sur les Réseaux Sociaux', type: 'recommandé', points: 75 },
        { id: 5, titre: 'Protection des Données Sensibles', type: 'recommandé', points: 100 },
        { id: 6, titre: 'Détection des Tentatives de Social Engineering', type: 'optionnel', points: 125 }
      );
    }

    return recommendations;
  }

  /**
   * Obtient les défis actifs
   */
  private async getActiveChallenges(userId: number): Promise<any[]> {
    // Logique pour récupérer les défis actifs
    return [
      {
        id: 1,
        titre: 'Défi Hebdomadaire',
        description: 'Compléter 3 modules cette semaine',
        type: 'hebdomadaire',
        progression: 1,
        objectif: 3,
        recompense: 100,
        badge_recompense: 'Assidu',
      },
    ];
  }

  /**
   * Obtient les alertes récentes
   */
  private async getRecentAlerts(): Promise<any[]> {
    // Logique pour récupérer les alertes récentes
    return [
      {
        id: 1,
        titre: 'Nouvelle vague de phishing',
        niveau: 'élevé',
        type: 'phishing',
        date: new Date().toISOString(),
      },
    ];
  }

  /**
   * Vérifie les conditions d'obtention d'un badge
   */
  private async checkBadgeConditions(userId: number, badge: Badge, reason: string): Promise<boolean> {
    switch (badge.categorie) {
      case BadgeCategory.PREMIER_PAS:
        return reason.includes('module') || reason.includes('quiz');
      
      case BadgeCategory.VIGILANCE:
        return reason.includes('simulation');
      
      case BadgeCategory.QUIZ:
        // Badge strict pour score parfait sur quiz final
        if (badge.nom === 'Quiz Parfait') {
          // Récupérer toutes les réponses aux quiz finaux de l'utilisateur
          const finalQuizResponses = await this.quizResponseRepository.find({
            where: { utilisateur: { users_id: userId }, quiz: { type_quiz: 'parcours_final' as any } },
            relations: ['quiz', 'quiz.questions'],
          });

          if (finalQuizResponses.length === 0) return false;

          // Regrouper par quiz et vérifier si au moins un quiz final a 100%
          const finalQuizIds = [...new Set(finalQuizResponses.map(r => r.quiz.quiz_id))];
          for (const quizId of finalQuizIds) {
            const responsesForQuiz = finalQuizResponses.filter(r => r.quiz.quiz_id === quizId);
            const totalObtained = responsesForQuiz.reduce((sum, r) => sum + Number(r.points_obtenus || 0), 0);
            const totalPoints = responsesForQuiz[0].quiz.questions ?
              responsesForQuiz[0].quiz.questions.reduce((sum, q) => sum + Number(q.points || 0), 0) : 0;
            const percentage = totalPoints > 0 ? (totalObtained / totalPoints) * 100 : 0;
            if (percentage >= 100) {
              return true;
            }
          }
          return false;
        }
        return reason.includes('quiz');
      
      case BadgeCategory.ASSIDUITE:
        const userLevel = await this.userLevelRepository.findOne({
          where: { utilisateur: { users_id: userId } },
        });
        return userLevel?.jours_consecutifs ? userLevel.jours_consecutifs >= 7 : false;
      
      case BadgeCategory.EXPERT:
        // Vérifier si l'utilisateur a complété tous les modules de phishing
        if (badge.nom === 'Expert Phishing') {
          const phishingModules = await this.learningModuleRepository.find({
            where: { titre: Like('%phishing%') },
          });
          
          if (phishingModules.length === 0) return false;
          
          const phishingModuleIds = phishingModules.map(m => m.module_id);
          
          const completedModules = await this.progressRepository.count({
            where: {
              utilisateur: { users_id: userId },
              module: { module_id: In(phishingModuleIds) } as any,
              statut: ProgressStatus.TERMINE,
            } as any,
          });
          
          return completedModules === phishingModules.length;
        }
        return false;
      
      case BadgeCategory.DEFENSEUR:
        // Vérifier si l'utilisateur a réussi 10 simulations
        if (badge.nom === 'Défenseur Cyber') {
          const simulationsReussies = await this.simulationResponseRepository.count({
            where: {
              utilisateur: { users_id: userId },
              statut: SimulationResponseStatus.REUSSIE,
            },
          });
          
          return simulationsReussies >= 10;
        }
        return false;
      
      default:
        return true;
    }
  }

  /**
   * Met à jour la connexion quotidienne
   */
  async updateDailyLogin(userId: number): Promise<void> {
    const userLevel = await this.userLevelRepository.findOne({
      where: { utilisateur: { users_id: userId } },
    });

    if (!userLevel) {
      return;
    }

    const today = new Date();
    const lastLogin = userLevel.derniere_connexion;

    if (lastLogin) {
      const daysDiff = Math.floor((today.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        // Connexion consécutive
        userLevel.jours_consecutifs += 1;
        await this.awardPoints(userId, this.POINTS_CONFIG.CONSECUTIVE_DAYS, 'Connexion consécutive');
        
        // Vérifier si l'utilisateur a atteint 7 jours consécutifs pour le badge "Assidu"
        if (userLevel.jours_consecutifs >= 7) {
          await this.attribuerBadge(userId, 'Assidu', '7 jours de connexion consécutifs');
        }
      } else if (daysDiff > 1) {
        // Rupture de la série
        userLevel.jours_consecutifs = 1;
        await this.awardPoints(userId, this.POINTS_CONFIG.DAILY_LOGIN, 'Connexion quotidienne');
      }
    } else {
      // Première connexion
      userLevel.jours_consecutifs = 1;
      await this.awardPoints(userId, this.POINTS_CONFIG.DAILY_LOGIN, 'Première connexion');
    }

    userLevel.derniere_connexion = today;
    await this.userLevelRepository.save(userLevel);
  }

  /**
   * Attribue un badge à un utilisateur
   */
  async attribuerBadge(userId: number, badgeNom: string, raison: string): Promise<void> {
    // Vérifier si l'utilisateur a déjà ce badge
    const existingBadge = await this.userBadgeRepository.findOne({
      where: {
        utilisateur: { users_id: userId },
        badge: { nom: badgeNom },
      },
      relations: ['badge'],
    });

    if (existingBadge) {
      return; // Badge déjà attribué
    }

    // Récupérer le badge
    const badge = await this.badgeRepository.findOne({
      where: { nom: badgeNom },
    });

    if (!badge) {
      this.logger.warn(`Badge non trouvé: ${badgeNom}`);
      return;
    }

    // Vérifier les conditions d'obtention
    const conditionsOk = await this.checkBadgeConditions(userId, badge, raison);
    if (!conditionsOk) {
      return;
    }

    // Attribuer le badge
    const userBadge = this.userBadgeRepository.create({
      utilisateur: { users_id: userId } as User,
      badge: badge,
      date_obtention: new Date(),
      contexte_obtention: raison,
      points_gagnes: badge.points_attribues,
    });

    await this.userBadgeRepository.save(userBadge);

    // Ajouter les points du badge
    await this.awardPoints(userId, badge.points_attribues, `Badge obtenu: ${badge.nom}`);
  }

  /**
   * Initialise les badges par défaut dans le système
   */
  async initBadges(initBadgesDto: InitBadgesDto): Promise<{ created: number; updated: number; errors: string[] }> {
    const { icones_path, force = false } = initBadgesDto;
    const result = { created: 0, updated: 0, errors: [] as string[] };

    // Vérifier si le chemin des icônes existe
    if (!fs.existsSync(icones_path)) {
      throw new BadRequestException(`Le chemin des icônes n'existe pas: ${icones_path}`);
    }

    // Parcourir les badges par défaut
    for (const badgeData of this.DEFAULT_BADGES) {
      try {
        // Vérifier si le badge existe déjà
        const existingBadge = await this.badgeRepository.findOne({
          where: { nom: badgeData.nom },
        });

        // Construire le chemin complet de l'icône
        const iconePath = path.join(icones_path, badgeData.icone_filename);
        const iconeExists = fs.existsSync(iconePath);

        if (!iconeExists) {
          result.errors.push(`L'icône ${badgeData.icone_filename} n'existe pas dans le chemin spécifié`);
          continue;
        }

        // Créer ou mettre à jour le badge
        if (!existingBadge) {
          // Créer un nouveau badge
          const newBadge = this.badgeRepository.create({
            ...badgeData,
            icone_url: iconePath,
            date_creation: new Date(),
            date_maj: new Date(),
          });

          await this.badgeRepository.save(newBadge);
          result.created++;
          this.logger.log(`Badge créé: ${badgeData.nom}`);
        } else if (force) {
          // Mettre à jour le badge existant si force=true
          existingBadge.description = badgeData.description;
          existingBadge.type = badgeData.type;
          existingBadge.categorie = badgeData.categorie;
          existingBadge.icone_url = iconePath;
          existingBadge.points_requis = badgeData.points_requis;
          existingBadge.points_attribues = badgeData.points_attribues;
          existingBadge.est_secret = badgeData.est_secret;
          existingBadge.conditions_obtention = badgeData.conditions_obtention;
          existingBadge.date_maj = new Date();

          await this.badgeRepository.save(existingBadge);
          result.updated++;
          this.logger.log(`Badge mis à jour: ${badgeData.nom}`);
        }
      } catch (error) {
        result.errors.push(`Erreur lors de la création/mise à jour du badge ${badgeData.nom}: ${error.message}`);
        this.logger.error(`Erreur lors de la création/mise à jour du badge ${badgeData.nom}`, error.stack);
      }
    }

    return result;
  }

  /**
   * Récupère tous les badges
   */
  async getAllBadges(): Promise<Badge[]> {
    return this.badgeRepository.find();
  }

  /**
   * Récupère un badge par son ID
   */
  async getBadgeById(badgeId: number): Promise<Badge> {
    const badge = await this.badgeRepository.findOne({
      where: { badge_id: badgeId },
    });

    if (!badge) {
      throw new NotFoundException(`Badge avec ID ${badgeId} non trouvé`);
    }

    return badge;
  }
  
  /**
   * Récupère un badge par son nom
   */
  async getBadgeByName(nom: string): Promise<Badge> {
    const badge = await this.badgeRepository.findOne({
      where: { nom },
    });

    if (!badge) {
      throw new NotFoundException(`Badge avec le nom '${nom}' non trouvé`);
    }

    return badge;
  }

  /**
   * Crée un nouveau badge
   */
  async createBadge(createBadgeDto: CreateBadgeDto): Promise<Badge> {
    // Vérifier si un badge avec le même nom existe déjà
    const existingBadge = await this.badgeRepository.findOne({
      where: { nom: createBadgeDto.nom },
    });

    if (existingBadge) {
      throw new BadRequestException(`Un badge avec le nom '${createBadgeDto.nom}' existe déjà`);
    }

    // Gérer l'icône du badge
    let iconePath = '';
    if (createBadgeDto.icone_file) {
      // Assurer que le répertoire existe
      const badgesDir = path.join(process.cwd(), 'ressources', 'badges');
      if (!fs.existsSync(badgesDir)) {
        fs.mkdirSync(badgesDir, { recursive: true });
      }

      // Générer un nom de fichier unique
      const fileExt = path.extname(createBadgeDto.icone_file.originalname);
      const fileName = `${createBadgeDto.nom.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}${fileExt}`;
      iconePath = path.join(badgesDir, fileName);

      // Écrire le fichier
      fs.writeFileSync(iconePath, createBadgeDto.icone_file.buffer);
    }

    // Créer le nouveau badge
    const newBadge = this.badgeRepository.create({
      ...createBadgeDto,
      icone_url: iconePath || createBadgeDto.icone_url,
      date_creation: new Date(),
      date_maj: new Date(),
    });

    return this.badgeRepository.save(newBadge);
  }

  /**
   * Met à jour un badge existant
   */
  async updateBadge(badgeId: number, updateBadgeDto: UpdateBadgeDto): Promise<Badge> {
    // Vérifier si le badge existe
    const badge = await this.getBadgeById(badgeId);

    // Gérer l'icône du badge si une nouvelle est fournie
    let iconePath = '';
    if (updateBadgeDto.icone_file) {
      // Assurer que le répertoire existe
      const badgesDir = path.join(process.cwd(), 'resources', 'badges');
      if (!fs.existsSync(badgesDir)) {
        fs.mkdirSync(badgesDir, { recursive: true });
      }

      // Générer un nom de fichier unique
      const fileExt = path.extname(updateBadgeDto.icone_file.originalname);
      const fileName = `${badge.nom.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}${fileExt}`;
      iconePath = path.join(badgesDir, fileName);

      // Écrire le fichier
      fs.writeFileSync(iconePath, updateBadgeDto.icone_file.buffer);
      
      // Supprimer l'ancienne icône si elle existe
      if (badge.icone_url && fs.existsSync(badge.icone_url)) {
        try {
          fs.unlinkSync(badge.icone_url);
        } catch (error) {
          this.logger.warn(`Impossible de supprimer l'ancienne icône: ${badge.icone_url}`, error);
        }
      }
      
      // Mettre à jour le chemin de l'icône
      updateBadgeDto.icone_url = iconePath;
    }

    // Mettre à jour les propriétés
    Object.assign(badge, updateBadgeDto);
    badge.date_maj = new Date();

    return this.badgeRepository.save(badge);
  }

  /**
   * Supprime un badge et ses attributions aux utilisateurs
   */
  async deleteBadge(badgeId: number): Promise<void> {
    const badge = await this.getBadgeById(badgeId);
    // Supprimer les attributions UserBadge liées
    await this.userBadgeRepository.delete({ badge: { badge_id: badgeId } as any });
    // Supprimer le badge
    await this.badgeRepository.delete({ badge_id: badge.badge_id } as any);
  }

  // ===== MÉTHODES D'INTÉGRATION AVEC LES MODULES EXISTANTS =====

  /**
   * Ajoute des points lors de la completion d'un module
   */
  async addModuleCompletionPoints(userId: number, moduleId: number, score: number): Promise<any> {
    const userLevel = await this.userLevelRepository.findOne({
      where: { utilisateur: { users_id: userId } },
    });

    if (!userLevel) {
      throw new Error('Niveau utilisateur non trouvé');
    }

    // Récupérer les informations du module
    const module = await this.learningModuleRepository.findOne({
      where: { module_id: moduleId },
    });

    if (!module) {
      throw new Error('Module non trouvé');
    }

    // let pointsGagnes = module.points_completion || 50;
    let pointsGagnes = this.POINTS_CONFIG.MODULE_COMPLETE;

    // Bonus pour un bon score
    if (score >= 90) {
      pointsGagnes += 25; // Bonus excellence
    } else if (score >= 80) {
      pointsGagnes += 15; // Bonus très bien
    } else if (score >= 70) {
      pointsGagnes += 5; // Bonus bien
    }

    // Ajouter les points
    userLevel.points_totaux += pointsGagnes;
    userLevel.points_niveau_actuel += pointsGagnes;
    userLevel.modules_completes += 1;
    userLevel.derniere_activite = new Date();

    await this.userLevelRepository.save(userLevel);

    // Vérifier si un badge doit être attribué
    // Badge "Premier Pas" pour le premier module complété
    if (userLevel.modules_completes === 1) {
      await this.attribuerBadge(userId, 'Premier Pas', `Premier module complété: ${module.titre}`);
    }
    if (module.badge_associe) {
      await this.attribuerBadge(userId, module.badge_associe, `Completion du module: ${module.titre}`);
    }

    return {
      message: 'Points ajoutés pour la completion du module',
      points_gagnes: pointsGagnes,
      points_totaux: userLevel.points_totaux,
      module_complete: module.titre,
      score: score,
    };
  }

  /**
   * Ajoute des points lors de la réussite d'un quiz
   */
  async addQuizSuccessPoints(userId: number, moduleId: number, score: number): Promise<any> {
    let userLevel = await this.userLevelRepository.findOne({
      where: { utilisateur: { users_id: userId } },
    });

    if (!userLevel) {
      console.log(`Création du niveau utilisateur pour user ${userId}`);
      // Créer le niveau utilisateur s'il n'existe pas
      userLevel = this.userLevelRepository.create({
        utilisateur: { users_id: userId } as any,
        niveau_actuel: 'debutant' as any,
        points_totaux: 0,
        points_niveau_actuel: 0,
        points_pour_niveau_suivant: 100, // Points nécessaires pour le niveau suivant
        quiz_reussis: 0,
        modules_completes: 0,
        simulations_reussies: 0,
        jours_consecutifs: 0,
        derniere_activite: new Date()
      });
      await this.userLevelRepository.save(userLevel);
    }

    // Points proportionnels au score (0-100)
    // const pointsGagnes = Math.max(0, Math.round(score));
    const pointsGagnes = this.POINTS_CONFIG.QUIZ_SUCCESS;
    console.log(`Ajout de ${pointsGagnes} points pour user ${userId}, score: ${score}`);

    userLevel.points_totaux += pointsGagnes;
    userLevel.points_niveau_actuel += pointsGagnes;
    userLevel.quiz_reussis += 1;
    userLevel.derniere_activite = new Date();

    await this.userLevelRepository.save(userLevel);
    console.log(`Points sauvegardés: total=${userLevel.points_totaux}, niveau=${userLevel.points_niveau_actuel}`);

    // Badge "Quiz Parfait" pour 100%
    if (score >= 100) {
      // Récupérer le module pour le contexte du badge si possible
      const module = await this.learningModuleRepository.findOne({ where: { module_id: moduleId } });
      await this.attribuerBadge(userId, 'Quiz Parfait', `Score parfait au quiz du module: ${module?.titre || moduleId}`);
    }

    return {
      message: 'Points ajoutés pour la réussite du quiz',
      points_gagnes: pointsGagnes,
      points_totaux: userLevel.points_totaux,
      quiz_reussi: true,
      score: score,
    };
  }

  /**
   * Ajoute des points lors de la réussite d'une simulation
   */
  async addSimulationSuccessPoints(userId: number, simulationId: number, score: number): Promise<any> {
    const userLevel = await this.userLevelRepository.findOne({
      where: { utilisateur: { users_id: userId } },
    });

    if (!userLevel) {
      throw new Error('Niveau utilisateur non trouvé');
    }

    // Récupérer les informations de la simulation
    const simulation = await this.simulationRepository.findOne({
      where: { simulation_id: simulationId },
    });

    if (!simulation) {
      throw new Error('Simulation non trouvée');
    }

    // let pointsGagnes = simulation.points_reussite || 30;
    let pointsGagnes = this.POINTS_CONFIG.SIMULATION_SUCCESS;

    // Bonus pour un bon score à la simulation
    if (score >= 90) {
      pointsGagnes += 25; // Bonus excellence
    } else if (score >= 80) {
      pointsGagnes += 15; // Bonus très bien
    } else if (score >= 70) {
      pointsGagnes += 10; // Bonus bien
    }

    // Ajouter les points
    userLevel.points_totaux += pointsGagnes;
    userLevel.points_niveau_actuel += pointsGagnes;
    userLevel.simulations_reussies += 1;
    userLevel.derniere_activite = new Date();

    await this.userLevelRepository.save(userLevel);

    // Badge "Vigilant" pour la première simulation réussie
    if (userLevel.simulations_reussies === 1) {
      await this.attribuerBadge(userId, 'Vigilant', `Première simulation réussie: ${simulation.titre || 'Simulation'}`);
    }

    // Vérifier si un badge "Expert Phishing" doit être attribué pour les simulations de phishing
    if (simulation.type === 'phishing_email' && score >= 85) {
      await this.attribuerBadge(userId, 'Expert Phishing', `Excellente performance dans la simulation de phishing`);
    }
    
    // Vérifier si l'utilisateur a atteint 10 simulations réussies pour le badge "Défenseur Cyber"
    if (userLevel.simulations_reussies >= 10) {
      await this.attribuerBadge(userId, 'Défenseur Cyber', `10 simulations réussies`);
    }

    return {
      message: 'Points ajoutés pour la réussite de la simulation',
      points_gagnes: pointsGagnes,
      points_totaux: userLevel.points_totaux,
      simulation_reussie: true,
      score: score,
    };
  }

  /**
   * Vérifie et génère automatiquement une certification si éligible
   */
  async checkAndGenerateCertification(userId: number, parcoursId: number): Promise<any> {
    try {
      // Vérifier l'éligibilité
      const eligibility = await this.certificateService.checkCertificationEligibility(userId, parcoursId);
      
      if (eligibility.eligible) {
        // Générer la certification
        const certification = await this.certificateService.generateCertification(userId, parcoursId);
        
        // Ajouter des points bonus pour l'obtention de la certification
        const pointsGagnes = this.POINTS_CONFIG.CHALLENGE_COMPLETE;
        await this.awardPoints(userId, pointsGagnes, 'Obtention de certification');
        
        return {
          certification_generated: true,
          certification: {
            id: certification.certification_id,
            numero: certification.numero_certification,
            score: certification.score_final,
          },
          points_bonus: pointsGagnes,
        };
      }
      
      return {
        certification_generated: false,
        eligibility: eligibility,
      };
    } catch (error) {
      this.logger.error(`Erreur lors de la vérification de certification: ${error.message}`);
      return {
        certification_generated: false,
        error: error.message,
      };
    }
  }
}

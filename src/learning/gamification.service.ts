import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from '../users/users.entity';
import { Badge, BadgeType, BadgeCategory } from './entities/badge.entity';
import { UserBadge } from './entities/user-badge.entity';
import { UserLevel, UserLevelEnum } from './entities/user-level.entity';
import { SimulationResponse, SimulationResponseStatus } from './entities/simulation-response.entity';
import { ChallengeParticipation } from './entities/challenge-participation.entity';
import { Progress, ProgressStatus } from './entities/progress.entity';
import { QuizResponse } from './entities/quiz-response.entity';
import { DashboardDto, UserLevelDto } from './dto/gamification.dto';
import { LearningPathModule } from './entities/learning-module.entity';
import { Simulation } from './entities/simulation.entity';
import { CertificateService } from './certificate.service';

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

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

  // Points attribués pour différentes actions
  private readonly POINTS_CONFIG = {
    MODULE_COMPLETE: 50,
    QUIZ_SUCCESS: 25,
    SIMULATION_SUCCESS: 150,
    BADGE_OBTAINED: 25,
    CHALLENGE_COMPLETE: 100,
    DAILY_LOGIN: 5,
    CONSECUTIVE_DAYS: 10,
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
   */
  async awardPoints(userId: number, points: number, reason: string): Promise<void> {
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
        userLevel.points_niveau_actuel = 0;
        userLevel.points_pour_niveau_suivant = this.getNextLevelThreshold(newLevel);
      }

      await queryRunner.manager.save(UserLevel, userLevel);

      // Vérifier les badges débloqués
      await this.checkAndAwardBadges(userId, newPoints, reason);

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
      where: { points_requis: { $lte: totalPoints } } as any,
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

    // Attribuer les points du badge
    if (badge.points_attribues > 0) {
      await this.awardPoints(userId, badge.points_attribues, `Badge: ${badge.nom}`);
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
    const [modulesCompletes, quizReussis, simulationsReussies] = await Promise.all([
      this.progressRepository.count({
        where: {
          utilisateur: { users_id: userId },
          statut: ProgressStatus.TERMINE,
        },
      }),
      this.quizResponseRepository.count({
        where: {
          utilisateur: { users_id: userId },
          score: { $gte: 70 },
        } as any,
      }),
      this.simulationResponseRepository.count({
        where: {
          utilisateur: { users_id: userId },
          statut: SimulationResponseStatus.REUSSIE,
        },
      }),
    ]);

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
  private async getUserBadges(userId: number): Promise<{ obtenus: any[]; disponibles: any[] }> {
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
        return reason.includes('quiz');
      
      case BadgeCategory.ASSIDUITE:
        const userLevel = await this.userLevelRepository.findOne({
          where: { utilisateur: { users_id: userId } },
        });
        return userLevel?.jours_consecutifs ? userLevel.jours_consecutifs >= 7 : false;
      
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

    let pointsGagnes = module.points_completion || 50;

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
    const pointsGagnes = Math.max(0, Math.round(score));
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

    let pointsGagnes = simulation.points_reussite || 30;

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

    // Vérifier si un badge "Expert Phishing" doit être attribué pour les simulations de phishing
    if (simulation.type === 'phishing_email' && score >= 85) {
      await this.attribuerBadge(userId, 'Expert Phishing', `Excellente performance dans la simulation de phishing`);
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
        await this.awardPoints(userId, 200, 'Obtention de certification');
        
        return {
          certification_generated: true,
          certification: {
            id: certification.certification_id,
            numero: certification.numero_certification,
            score: certification.score_final,
          },
          points_bonus: 200,
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

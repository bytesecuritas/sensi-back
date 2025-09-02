import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, In } from 'typeorm';
import { Organisation, OrganisationType } from './organisations.entity';
import { CreateOrganisationDto, UpdateOrganisationDto } from './dto';
import { User } from '../users/users.entity';
import { Progress, ProgressStatus } from '../learning/entities/progress.entity';
import { LearningPath } from '../learning/entities/learning-path.entity';
import { OrganisationLearningPath } from '../learning/entities/organisation-learning-path.entity';
import { Certification } from '../learning/entities/certification.entity';

@Injectable()
export class OrganisationsService {
  constructor(
    @InjectRepository(Organisation)
    private organisationsRepository: Repository<Organisation>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(OrganisationLearningPath)
    private organisationLearningPathRepository: Repository<OrganisationLearningPath>,
    @InjectRepository(Progress)
    private progressRepository: Repository<Progress>,
    @InjectRepository(Certification)
    private certificationRepository: Repository<Certification>,
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
    
    // Statistiques de base des utilisateurs
    const [totalUsers, adminCount, userCount] = await Promise.all([
      this.usersRepository.count({ where: { organisation: { organisation_id: organisationId } } }),
      this.usersRepository.count({ where: { organisation: { organisation_id: organisationId }, role: 'admin' } }),
      this.usersRepository.count({ where: { organisation: { organisation_id: organisationId }, role: 'user' } })
    ]);

    // Statistiques des parcours
    const organisationParcours = await this.organisationLearningPathRepository.find({
      where: { organisation: { organisation_id: organisationId }, actif: true },
      relations: ['parcours', 'parcours.modules'],
    });

    const totalParcours = organisationParcours.length;
    const totalModules = organisationParcours.reduce((sum, orgPath) => 
      sum + (orgPath.parcours.modules?.length || 0), 0
    );

    // Statistiques des progressions
    const progressions = await this.progressRepository.find({
      where: { 
        utilisateur: { organisation: { organisation_id: organisationId } }
      },
      relations: ['parcours', 'utilisateur'],
    });

    // Calculer les statistiques de progression par parcours
    const parcoursStats = new Map<number, any>();
    
    for (const orgPath of organisationParcours) {
      const parcoursId = orgPath.parcours.parcours_id;
      const parcoursProgressions = progressions.filter(p => 
        p.parcours?.parcours_id === parcoursId
      );

      const usersInParcours = new Set(parcoursProgressions.map(p => p.utilisateur.users_id));
      const totalUsersInParcours = usersInParcours.size;
      
      const completedModules = parcoursProgressions.filter(p => p.statut === ProgressStatus.TERMINE).length;
      const totalModulesInParcours = orgPath.parcours.modules?.length || 0;
      
      const avgScore = parcoursProgressions.length > 0 
        ? parcoursProgressions.reduce((sum, p) => sum + (p.score || 0), 0) / parcoursProgressions.length
        : 0;

      const avgTimeSpent = parcoursProgressions.length > 0
        ? parcoursProgressions.reduce((sum, p) => sum + (p.temps_passe || 0), 0) / parcoursProgressions.length
        : 0;

      parcoursStats.set(parcoursId, {
        parcours_id: parcoursId,
        titre: orgPath.parcours.titre,
        public_cible: orgPath.parcours.public_cible,
        duree_estimee_heures: orgPath.parcours.duree_estimee_heures,
        total_modules: totalModulesInParcours,
        users_inscrits: totalUsersInParcours,
        modules_completes: completedModules,
        taux_completion: totalModulesInParcours > 0 ? (completedModules / totalModulesInParcours) * 100 : 0,
        score_moyen: Math.round(avgScore * 100) / 100,
        temps_moyen_heures: Math.round(avgTimeSpent * 100) / 100,
        date_ajout: orgPath.date_ajout
      });
    }

    // Statistiques des certifications
    const certifications = await this.certificationRepository.find({
      where: { 
        utilisateur: { organisation: { organisation_id: organisationId } }
      },
      relations: ['utilisateur', 'parcours'],
    });

    const totalCertifications = certifications.length;
    const certificationsByType = certifications.reduce((acc, cert) => {
      acc[cert.type_certification] = (acc[cert.type_certification] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Statistiques d'engagement
    const activeUsers = new Set(progressions.map(p => p.utilisateur.users_id)).size;
    const engagementRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;

    // Gamification: points totaux, niveaux et badges par organisation
    const userLevelRepo = this.usersRepository.manager.getRepository('UserLevel');
    const userBadgeRepo = this.usersRepository.manager.getRepository('UserBadge');
    const orgUsers = await this.usersRepository.find({ where: { organisation: { organisation_id: organisationId } } });
    const userIds = orgUsers.map(u => u.users_id);
    const levels = userIds.length ? await userLevelRepo.find({ where: { utilisateur: { users_id: In(userIds) } } } as any) : [];
    const badges = userIds.length ? await userBadgeRepo.find({ where: { utilisateur: { users_id: In(userIds) } }, relations: ['badge'] } as any) : [];
    const totalPoints = levels.reduce((sum: number, l: any) => sum + (l.points_totaux || 0), 0);
    const avgPoints = totalUsers > 0 ? totalPoints / totalUsers : 0;
    const totalBadges = badges.length;

    // Statistiques temporelles (derniers 30 jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentProgressions = progressions.filter(p => 
      p.date_creation >= thirtyDaysAgo
    );
    const recentCompletions = recentProgressions.filter(p => 
      p.statut === ProgressStatus.TERMINE
    ).length;

    // Top parcours par engagement
    const parcoursEngagement = Array.from(parcoursStats.values())
      .sort((a, b) => b.users_inscrits - a.users_inscrits)
      .slice(0, 5);

    // Utilisateurs les plus actifs
    const userActivity = new Map<number, { user: any; modules_completes: number; score_moyen: number; temps_total: number }>();
    
    for (const prog of progressions) {
      const userId = prog.utilisateur.users_id;
      if (!userActivity.has(userId)) {
        userActivity.set(userId, {
          user: {
            users_id: prog.utilisateur.users_id,
            nom: prog.utilisateur.nom,
            prenom: prog.utilisateur.prenom,
            email: prog.utilisateur.email
          },
          modules_completes: 0,
          score_moyen: 0,
          temps_total: 0
        });
      }
      
      const userData = userActivity.get(userId)!;
      if (prog.statut === ProgressStatus.TERMINE) {
        userData.modules_completes++;
      }
      userData.temps_total += prog.temps_passe || 0;
    }

    // Calculer les scores moyens
    for (const [userId, userData] of userActivity) {
      const userProgressions = progressions.filter(p => p.utilisateur.users_id === userId);
      if (userProgressions.length > 0) {
        userData.score_moyen = Math.round(
          userProgressions.reduce((sum, p) => sum + (p.score || 0), 0) / userProgressions.length * 100
        ) / 100;
      }
    }

    const topUsers = Array.from(userActivity.values())
      .sort((a, b) => b.modules_completes - a.modules_completes)
      .slice(0, 10);

    return {
      organisation_id: organisation.organisation_id,
      nom: organisation.nom,
      type: organisation.type,
      code_pays: organisation.code_pays,
      date_creation: organisation.date_creation,
      stats: {
        // Statistiques de base
        total_users: totalUsers,
        admins: adminCount,
        users: userCount,
        
        // Statistiques des parcours
        total_parcours: totalParcours,
        total_modules: totalModules,
        parcours_stats: Array.from(parcoursStats.values()),
        
        // Statistiques des certifications
        total_certifications: totalCertifications,
        certifications_par_type: certificationsByType,
        
        // Statistiques d'engagement
        taux_engagement: Math.round(engagementRate * 100) / 100,
        utilisateurs_actifs: activeUsers,
        
        // Statistiques temporelles
        activite_30_jours: {
          progressions_recentes: recentProgressions.length,
          modules_completes: recentCompletions,
          nouveaux_utilisateurs: await this.usersRepository.count({
            where: { 
              organisation: { organisation_id: organisationId },
              date_creation: MoreThanOrEqual(thirtyDaysAgo)
            }
          })
        },
        
        // Classements
        top_parcours_engagement: parcoursEngagement,
        top_utilisateurs_actifs: topUsers,
        // Gamification
        gamification: {
          total_points: Math.round(totalPoints),
          points_moyens_par_utilisateur: Math.round(avgPoints * 100) / 100,
          total_badges_attribues: totalBadges,
        },
        
        // Métriques de performance
        performance_globale: {
          score_moyen_global: progressions.length > 0 
            ? Math.round(progressions.reduce((sum, p) => sum + (p.score || 0), 0) / progressions.length * 100) / 100
            : 0,
          temps_moyen_global: progressions.length > 0
            ? Math.round(progressions.reduce((sum, p) => sum + (p.temps_passe || 0), 0) / progressions.length * 100) / 100
            : 0,
          taux_completion_global: totalModules > 0 
            ? Math.round((progressions.filter(p => p.statut === ProgressStatus.TERMINE).length / totalModules) * 10000) / 100
            : 0
        }
      }
    };
  }

  async getParcoursStats(organisationId: number, parcoursId: number, periodeJours: number = 30): Promise<any> {
    await this.findOne(organisationId); // Vérifier que l'organisation existe

    // Vérifier que le parcours appartient à l'organisation
    const orgParcours = await this.organisationLearningPathRepository.findOne({
      where: { 
        organisation: { organisation_id: organisationId },
        parcours: { parcours_id: parcoursId },
        actif: true
      },
      relations: ['parcours', 'parcours.modules'],
    });

    if (!orgParcours) {
      throw new NotFoundException(`Parcours ${parcoursId} non trouvé dans l'organisation ${organisationId}`);
    }

    const dateLimite = new Date();
    dateLimite.setDate(dateLimite.getDate() - periodeJours);

    // Récupérer les progressions du parcours
    const progressions = await this.progressRepository.find({
      where: { 
        utilisateur: { organisation: { organisation_id: organisationId } },
        parcours: { parcours_id: parcoursId }
      },
      relations: ['parcours', 'utilisateur'],
    });

    // Progressions récentes
    const progressionsRecentes = progressions.filter(p => p.date_creation >= dateLimite);

    // Statistiques par module (basées sur les quiz de module)
    const modulesStats = new Map<number, any>();
    for (const module of orgParcours.parcours.modules || []) {
      // Pour les statistiques par module, on utilise les quiz de module
      // La progression est maintenant liée au parcours, mais on peut calculer les stats par module
      // en analysant les quiz de chaque module
      
      const moduleProgressions = progressions.filter(p => p.parcours.parcours_id === parcoursId);
      const moduleProgressionsRecentes = progressionsRecentes.filter(p => p.parcours.parcours_id === parcoursId);

      // Calculer les statistiques basées sur la progression du parcours
      const completedCount = moduleProgressions.filter(p => p.statut === ProgressStatus.TERMINE).length;
      const recentCompletedCount = moduleProgressionsRecentes.filter(p => p.statut === ProgressStatus.TERMINE).length;

      const avgScore = moduleProgressions.length > 0 
        ? moduleProgressions.reduce((sum, p) => sum + (p.score || 0), 0) / moduleProgressions.length
        : 0;

      const avgTimeSpent = moduleProgressions.length > 0
        ? moduleProgressions.reduce((sum, p) => sum + (p.temps_passe || 0), 0) / moduleProgressions.length
        : 0;

      modulesStats.set(module.module_id, {
        module_id: module.module_id,
        titre: module.titre,
        total_progressions: moduleProgressions.length,
        progressions_recentes: moduleProgressionsRecentes.length,
        modules_completes: completedCount,
        modules_completes_recentes: recentCompletedCount,
        taux_completion: moduleProgressions.length > 0 ? (completedCount / moduleProgressions.length) * 100 : 0,
        score_moyen: Math.round(avgScore * 100) / 100,
        temps_moyen_heures: Math.round(avgTimeSpent * 100) / 100
      });
    }

    // Statistiques par utilisateur
    const usersStats = new Map<number, any>();
    for (const prog of progressions) {
      const userId = prog.utilisateur.users_id;
      if (!usersStats.has(userId)) {
        usersStats.set(userId, {
          user: {
            users_id: prog.utilisateur.users_id,
            nom: prog.utilisateur.nom,
            prenom: prog.utilisateur.prenom,
            email: prog.utilisateur.email
          },
          modules_completes: 0,
          score_moyen: 0,
          temps_total: 0,
          derniere_activite: prog.date_creation
        });
      }

      const userData = usersStats.get(userId)!;
      if (prog.statut === ProgressStatus.TERMINE) {
        userData.modules_completes++;
      }
      userData.temps_total += prog.temps_passe || 0;
      if (prog.date_creation > userData.derniere_activite) {
        userData.derniere_activite = prog.date_creation;
      }
    }

    // Calculer les scores moyens par utilisateur
    for (const [userId, userData] of usersStats) {
      const userProgressions = progressions.filter(p => p.utilisateur.users_id === userId);
      if (userProgressions.length > 0) {
        userData.score_moyen = Math.round(
          userProgressions.reduce((sum, p) => sum + (p.score || 0), 0) / userProgressions.length * 100
        ) / 100;
      }
    }

    // Statistiques temporelles
    const progressionsParJour = new Map<string, number>();
    for (const prog of progressionsRecentes) {
      const date = prog.date_creation.toISOString().split('T')[0];
      progressionsParJour.set(date, (progressionsParJour.get(date) || 0) + 1);
    }

    return {
      parcours_id: parcoursId,
      titre: orgParcours.parcours.titre,
      public_cible: orgParcours.parcours.public_cible,
      duree_estimee_heures: orgParcours.parcours.duree_estimee_heures,
      periode_analyse: periodeJours,
      stats: {
        total_modules: orgParcours.parcours.modules?.length || 0,
        total_progressions: progressions.length,
        progressions_recentes: progressionsRecentes.length,
        modules_completes: progressions.filter(p => p.statut === ProgressStatus.TERMINE).length,
        modules_completes_recentes: progressionsRecentes.filter(p => p.statut === ProgressStatus.TERMINE).length,
        utilisateurs_inscrits: new Set(progressions.map(p => p.utilisateur.users_id)).size,
        utilisateurs_actifs_recents: new Set(progressionsRecentes.map(p => p.utilisateur.users_id)).size,
        modules_stats: Array.from(modulesStats.values()),
        utilisateurs_stats: Array.from(usersStats.values()),
        activite_temporelle: Object.fromEntries(progressionsParJour)
      }
    };
  }

  async getUserStats(organisationId: number, userId: number): Promise<any> {
    await this.findOne(organisationId); // Vérifier que l'organisation existe

    // Vérifier que l'utilisateur appartient à l'organisation
    const user = await this.usersRepository.findOne({
      where: { 
        users_id: userId,
        organisation: { organisation_id: organisationId }
      }
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur ${userId} non trouvé dans l'organisation ${organisationId}`);
    }

    // Récupérer toutes les progressions de l'utilisateur
    const progressions = await this.progressRepository.find({
      where: { utilisateur: { users_id: userId } },
      relations: ['parcours'],
    });

    // Récupérer les certifications de l'utilisateur
    const certifications = await this.certificationRepository.find({
      where: { utilisateur: { users_id: userId } },
      relations: ['parcours'],
    });

    // Statistiques par parcours
    const parcoursStats = new Map<number, any>();
    for (const prog of progressions) {
      const parcoursId = prog.parcours?.parcours_id;
      if (!parcoursId) continue;

      if (!parcoursStats.has(parcoursId)) {
        parcoursStats.set(parcoursId, {
          parcours_id: parcoursId,
          titre: prog.parcours.titre,
          public_cible: prog.parcours.public_cible,
          modules_completes: 0,
          score_moyen: 0,
          temps_total: 0,
          derniere_activite: prog.date_creation,
          statut_global: 'en_cours'
        });
      }

      const parcoursData = parcoursStats.get(parcoursId)!;
      if (prog.statut === ProgressStatus.TERMINE) {
        parcoursData.modules_completes++;
      }
      parcoursData.temps_total += prog.temps_passe || 0;
      if (prog.date_creation > parcoursData.derniere_activite) {
        parcoursData.derniere_activite = prog.date_creation;
      }
    }

    // Calculer les scores moyens et statuts par parcours
    for (const [parcoursId, parcoursData] of parcoursStats) {
      const parcoursProgressions = progressions.filter(p => p.parcours?.parcours_id === parcoursId);
      if (parcoursProgressions.length > 0) {
        parcoursData.score_moyen = Math.round(
          parcoursProgressions.reduce((sum, p) => sum + (p.score || 0), 0) / parcoursProgressions.length * 100
        ) / 100;
      }

      // Déterminer le statut global du parcours
      const totalModules = parcoursProgressions.length;
      const completedModules = parcoursProgressions.filter(p => p.statut === ProgressStatus.TERMINE).length;
      
      if (completedModules === 0) {
        parcoursData.statut_global = 'non_commence';
      } else if (completedModules === totalModules) {
        parcoursData.statut_global = 'termine';
      } else {
        parcoursData.statut_global = 'en_cours';
      }
    }

    // Statistiques temporelles
    const progressionsParMois = new Map<string, number>();
    const completionsParMois = new Map<string, number>();
    
    for (const prog of progressions) {
      const mois = prog.date_creation.toISOString().substring(0, 7); // YYYY-MM
      progressionsParMois.set(mois, (progressionsParMois.get(mois) || 0) + 1);
      
      if (prog.statut === ProgressStatus.TERMINE) {
        completionsParMois.set(mois, (completionsParMois.get(mois) || 0) + 1);
      }
    }

    // Calculer les métriques globales
    const totalModules = progressions.length;
    const totalCompleted = progressions.filter(p => p.statut === ProgressStatus.TERMINE).length;
    const avgScore = progressions.length > 0 
      ? progressions.reduce((sum, p) => sum + (p.score || 0), 0) / progressions.length
      : 0;
    const totalTimeSpent = progressions.reduce((sum, p) => sum + (p.temps_passe || 0), 0);

    return {
      user: {
        users_id: user.users_id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        date_creation: user.date_creation
      },
      stats: {
        total_modules: totalModules,
        modules_completes: totalCompleted,
        taux_completion_global: totalModules > 0 ? (totalCompleted / totalModules) * 100 : 0,
        score_moyen_global: Math.round(avgScore * 100) / 100,
        temps_total_heures: Math.round(totalTimeSpent * 100) / 100,
        total_certifications: certifications.length,
        parcours_commences: parcoursStats.size,
        parcours_termines: Array.from(parcoursStats.values()).filter(p => p.statut_global === 'termine').length,
        parcours_stats: Array.from(parcoursStats.values()),
        certifications: certifications.map(cert => ({
          certification_id: cert.certification_id,
          type_certification: cert.type_certification,
          parcours_titre: cert.parcours.titre,
          date_emission: cert.date_emission
        })),
        activite_temporelle: {
          progressions_par_mois: Object.fromEntries(progressionsParMois),
          completions_par_mois: Object.fromEntries(completionsParMois)
        }
      }
    };
  }

  async getComparatifStats(organisationId: number, periodeJours: number = 30): Promise<any> {
    await this.findOne(organisationId); // Vérifier que l'organisation existe

    const dateLimite = new Date();
    dateLimite.setDate(dateLimite.getDate() - periodeJours);

    // Récupérer tous les parcours de l'organisation
    const organisationParcours = await this.organisationLearningPathRepository.find({
      where: { organisation: { organisation_id: organisationId }, actif: true },
      relations: ['parcours', 'parcours.modules'],
    });

    // Récupérer toutes les progressions récentes
    const progressionsRecentes = await this.progressRepository.find({
      where: { 
        utilisateur: { organisation: { organisation_id: organisationId } },
        date_creation: MoreThanOrEqual(dateLimite)
      },
      relations: ['parcours', 'utilisateur'],
    });

    // Comparatif des performances par parcours
    const comparatifParcours: any[] = [];
    
    for (const orgPath of organisationParcours) {
      const parcoursId = orgPath.parcours.parcours_id;
      const parcoursProgressions = progressionsRecentes.filter(p => 
        p.parcours?.parcours_id === parcoursId
      );

      const usersInParcours = new Set(parcoursProgressions.map(p => p.utilisateur.users_id));
      const completedModules = parcoursProgressions.filter(p => p.statut === ProgressStatus.TERMINE).length;
      
      const avgScore = parcoursProgressions.length > 0 
        ? parcoursProgressions.reduce((sum, p) => sum + (p.score || 0), 0) / parcoursProgressions.length
        : 0;

      const avgTimeSpent = parcoursProgressions.length > 0
        ? parcoursProgressions.reduce((sum, p) => sum + (p.temps_passe || 0), 0) / parcoursProgressions.length
        : 0;

      comparatifParcours.push({
        parcours_id: parcoursId,
        titre: orgPath.parcours.titre,
        public_cible: orgPath.parcours.public_cible,
        duree_estimee_heures: orgPath.parcours.duree_estimee_heures,
        utilisateurs_actifs: usersInParcours.size,
        modules_completes: completedModules,
        score_moyen: Math.round(avgScore * 100) / 100,
        temps_moyen_heures: Math.round(avgTimeSpent * 100) / 100,
        taux_engagement: organisationParcours.length > 0 ? (usersInParcours.size / organisationParcours.length) * 100 : 0
      });
    }

    // Trier par différents critères
    const triParEngagement = [...comparatifParcours].sort((a, b) => b.utilisateurs_actifs - a.utilisateurs_actifs);
    const triParScore = [...comparatifParcours].sort((a, b) => b.score_moyen - a.score_moyen);
    const triParCompletion = [...comparatifParcours].sort((a, b) => b.modules_completes - a.modules_completes);

    // Statistiques globales de comparaison
    const totalUsers = new Set(progressionsRecentes.map(p => p.utilisateur.users_id)).size;
    const totalCompletions = progressionsRecentes.filter(p => p.statut === ProgressStatus.TERMINE).length;
    const globalAvgScore = progressionsRecentes.length > 0 
      ? progressionsRecentes.reduce((sum, p) => sum + (p.score || 0), 0) / progressionsRecentes.length
      : 0;

    return {
      organisation_id: organisationId,
      periode_analyse: periodeJours,
      date_debut: dateLimite,
      date_fin: new Date(),
      stats_globales: {
        total_utilisateurs_actifs: totalUsers,
        total_modules_completes: totalCompletions,
        score_moyen_global: Math.round(globalAvgScore * 100) / 100,
        total_parcours_actifs: organisationParcours.length
      },
      comparatif: {
        tous_parcours: comparatifParcours,
        top_engagement: triParEngagement.slice(0, 5),
        top_score: triParScore.slice(0, 5),
        top_completion: triParCompletion.slice(0, 5)
      }
    };
  }
}

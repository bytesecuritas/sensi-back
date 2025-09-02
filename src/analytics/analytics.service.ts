import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { User } from '../users/users.entity';
import { Organisation } from '../organisations/organisations.entity';
import { Progress, ProgressStatus } from '../learning/entities/progress.entity';
import { LearningPath } from '../learning/entities/learning-path.entity';
import { LearningPathModule } from '../learning/entities/learning-module.entity';
import { MediaContent } from '../learning/entities/media-content.entity';
import { OrganisationLearningPath } from '../learning/entities/organisation-learning-path.entity';
import { Certification } from '../learning/entities/certification.entity';
import { AnalyticsQueryDto, TimeRange } from './dto/analytics.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Organisation)
    private organisationRepository: Repository<Organisation>,
    @InjectRepository(Progress)
    private progressRepository: Repository<Progress>,
    @InjectRepository(LearningPath)
    private learningPathRepository: Repository<LearningPath>,
    @InjectRepository(LearningPathModule)
    private moduleRepository: Repository<LearningPathModule>,
    @InjectRepository(MediaContent)
    private mediaRepository: Repository<MediaContent>,
    @InjectRepository(OrganisationLearningPath)
    private orgLearningPathRepository: Repository<OrganisationLearningPath>,
    @InjectRepository(Certification)
    private certificationRepository: Repository<Certification>,
  ) {}

  private getDateRange(timeRange: TimeRange = TimeRange.MONTH, startDate?: string, endDate?: string) {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      switch (timeRange) {
        case TimeRange.DAY:
          start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case TimeRange.WEEK:
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case TimeRange.MONTH:
          start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          break;
        case TimeRange.QUARTER:
          start = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
          break;
        case TimeRange.YEAR:
          start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          break;
        default:
          start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      }
    }

    return { start, end };
  }

  async getGlobalDashboard(query: AnalyticsQueryDto) {
    const { start, end } = this.getDateRange(query.timeRange, query.startDate, query.endDate);

    const [
      totalUsers,
      totalOrganisations,
      totalLearningPaths,
      totalModules,
      totalCertifications,
      activeUsers,
      newUsers,
      completedModules,
      totalProgress,
    ] = await Promise.all([
      this.userRepository.count(),
      this.organisationRepository.count(),
      this.learningPathRepository.count(),
      this.moduleRepository.count(),
      this.certificationRepository.count(),
      this.userRepository.count({ where: { date_maj: MoreThanOrEqual(start) } }),
      this.userRepository.count({ where: { date_creation: Between(start, end) } }),
      this.progressRepository.count({ where: { statut: ProgressStatus.TERMINE, date_completion: Between(start, end) } }),
      this.progressRepository.count({ where: { date_creation: Between(start, end) } }),
    ]);

    const userGrowth = await this.getUserGrowth(start, end);
    const organisationStats = await this.getOrganisationStats(start, end);
    const learningPathStats = await this.getLearningPathStats(start, end);
    const certificationStats = await this.getCertificationStats(start, end);
    const topPerformingOrganisations = await this.getTopPerformingOrganisations(query.limit);
    const topLearningPaths = await this.getTopLearningPaths(query.limit);

    // Gamification global metrics
    const userLevelRepo = this.userRepository.manager.getRepository('UserLevel');
    const userBadgeRepo = this.userRepository.manager.getRepository('UserBadge');
    const allLevels = await userLevelRepo.find();
    const allBadges = await userBadgeRepo.count();
    const totalPoints = allLevels.reduce((sum: number, l: any) => sum + (l.points_totaux || 0), 0);

    return {
      overview: {
        totalUsers,
        totalOrganisations,
        totalLearningPaths,
        totalModules,
        totalCertifications,
        activeUsers,
        newUsers,
        completedModules,
        totalProgress,
        completionRate: totalProgress > 0 ? (completedModules / totalProgress * 100).toFixed(2) : 0,
        gamification: {
          totalPoints,
          avgPointsPerUser: totalUsers > 0 ? (totalPoints / totalUsers).toFixed(2) : '0',
          totalBadgesAwarded: allBadges,
        }
      },
      trends: {
        userGrowth,
        organisationStats,
        learningPathStats,
        certificationStats,
      },
      topPerformers: {
        organisations: topPerformingOrganisations,
        learningPaths: topLearningPaths,
      },
      period: { start, end },
    };
  }

  async getUserGrowth(start: Date, end: Date) {
    const userGrowth = await this.userRepository
      .createQueryBuilder('user')
      .select('DATE(user.date_creation)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('user.date_creation BETWEEN :start AND :end', { start, end })
      .groupBy('DATE(user.date_creation)')
      .orderBy('date', 'ASC')
      .getRawMany();

    return userGrowth;
  }

  async getOrganisationStats(start: Date, end: Date) {
    const stats = await this.organisationRepository
      .createQueryBuilder('org')
      .select('org.organisation_id', 'id')
      .addSelect('org.nom', 'name')
      .addSelect('COUNT(DISTINCT user.users_id)', 'totalUsers')
      .addSelect('COUNT(DISTINCT progress.progression_id)', 'totalProgress')
      .addSelect('COUNT(DISTINCT CASE WHEN progress.statut = "termine" THEN progress.progression_id END)', 'completedProgress')
      .addSelect('COUNT(DISTINCT CASE WHEN progress.certificat_obtenu = true THEN progress.progression_id END)', 'certificationsObtenues')
      .addSelect('AVG(progress.score)', 'avgScore')
      .leftJoin('org.utilisateurs', 'user')
      .leftJoin('user.progressions', 'progress')
      .where('progress.date_creation BETWEEN :start AND :end', { start, end })
      .groupBy('org.organisation_id')
      .getRawMany();

    return stats.map(stat => ({
      ...stat,
      completionRate: stat.totalProgress > 0 ? (stat.completedProgress / stat.totalProgress * 100).toFixed(2) : 0,
      certificationRate: stat.totalProgress > 0 ? (stat.certificationsObtenues / stat.totalProgress * 100).toFixed(2) : 0,
      avgScore: parseFloat(stat.avgScore || '0').toFixed(2),
    }));
  }

  async getLearningPathStats(start: Date, end: Date) {
    const stats = await this.learningPathRepository
      .createQueryBuilder('path')
      .select('path.parcours_id', 'id')
      .addSelect('path.titre', 'title')
      .addSelect('COUNT(DISTINCT progress.progression_id)', 'totalProgress')
      .addSelect('COUNT(DISTINCT CASE WHEN progress.statut = "termine" THEN progress.progression_id END)', 'completedProgress')
      .addSelect('AVG(progress.score)', 'avgProgress')
      .addSelect('COUNT(DISTINCT CASE WHEN progress.certificat_obtenu = true THEN progress.progression_id END)', 'certificationsObtenues')
      .leftJoin('path.progressions', 'progress')
      .where('progress.date_creation BETWEEN :start AND :end', { start, end })
      .groupBy('path.parcours_id')
      .getRawMany();

    return stats.map(stat => ({
      ...stat,
      completionRate: stat.totalProgress > 0 ? (stat.completedProgress / stat.totalProgress * 100).toFixed(2) : 0,
      avgProgress: parseFloat(stat.avgProgress || '0').toFixed(2),
      certificationRate: stat.totalProgress > 0 ? (stat.certificationsObtenues / stat.totalProgress * 100).toFixed(2) : 0,
    }));
  }

  async getCertificationStats(start: Date, end: Date) {
    const stats = await this.certificationRepository
      .createQueryBuilder('cert')
      .select('cert.certification_id', 'id')
      .addSelect('cert.titre', 'title')
      .addSelect('cert.type', 'type')
      .addSelect('COUNT(DISTINCT cert.certification_id)', 'totalCertifications')
      .addSelect('COUNT(DISTINCT CASE WHEN cert.date_obtention BETWEEN :start AND :end THEN cert.certification_id END)', 'newCertifications')
      .where('cert.date_creation BETWEEN :start AND :end', { start, end })
      .groupBy('cert.certification_id')
      .getRawMany();

    return stats;
  }

  async getTopPerformingOrganisations(limit: number = 10) {
    return this.organisationRepository
      .createQueryBuilder('org')
      .select('org.organisation_id', 'id')
      .addSelect('org.nom', 'name')
      .addSelect('COUNT(DISTINCT user.users_id)', 'totalUsers')
      .addSelect('COUNT(DISTINCT progress.progression_id)', 'totalProgress')
      .addSelect('COUNT(DISTINCT CASE WHEN progress.statut = "termine" THEN progress.progression_id END)', 'completedProgress')
      .leftJoin('org.utilisateurs', 'user')
      .leftJoin('user.progressions', 'progress')
      .groupBy('org.organisation_id')
      .orderBy('completedProgress', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  async getTopLearningPaths(limit: number = 10) {
    return this.learningPathRepository
      .createQueryBuilder('path')
      .select('path.parcours_id', 'id')
      .addSelect('path.titre', 'title')
      .addSelect('COUNT(DISTINCT progress.progression_id)', 'totalProgress')
      .addSelect('COUNT(DISTINCT CASE WHEN progress.statut = "termine" THEN progress.progression_id END)', 'completedProgress')
      .addSelect('AVG(progress.score)', 'avgProgress')
      .leftJoin('path.modules', 'module')
      .leftJoin('module.progressions', 'progress')
      .groupBy('path.parcours_id')
      .orderBy('completedProgress', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  async getDetailedOrganisationReport(organisationId: number, query: AnalyticsQueryDto) {
    const { start, end } = this.getDateRange(query.timeRange, query.startDate, query.endDate);

    const organisation = await this.organisationRepository.findOne({
      where: { organisation_id: organisationId },
      relations: ['utilisateurs', 'parcoursApprentissage'],
    });

    if (!organisation) {
      throw new Error('Organisation not found');
    }

    const userStats = await this.getOrganisationUserStats(organisationId, start, end);
    const learningPathStats = await this.getOrganisationLearningPathStats(organisationId, start, end);
    const certificationStats = await this.getOrganisationCertificationStats(organisationId, start, end);
    const activityTimeline = await this.getOrganisationActivityTimeline(organisationId, start, end);

    return {
      organisation: {
        id: organisation.organisation_id,
        name: organisation.nom,
        description: organisation.type,
        createdAt: organisation.date_ins,
      },
      userStats,
      learningPathStats,
      certificationStats,
      activityTimeline,
      period: { start, end },
    };
  }

  async getOrganisationUserStats(organisationId: number, start: Date, end: Date) {
    const users = await this.userRepository
      .createQueryBuilder('user')
      .select('user.users_id', 'id')
      .addSelect('user.email', 'email')
      .addSelect('user.prenom', 'firstName')
      .addSelect('user.nom', 'lastName')
      .addSelect('user.role', 'role')
      .addSelect('user.date_creation', 'createdAt')
      .addSelect('user.date_maj', 'lastLoginAt')
      .addSelect('COUNT(DISTINCT progress.progression_id)', 'totalProgress')
      .addSelect('COUNT(DISTINCT CASE WHEN progress.statut = "termine" THEN progress.progression_id END)', 'completedProgress')
      .addSelect('AVG(progress.score)', 'avgProgress')
      .leftJoin('user.progressions', 'progress')
      .where('user.organisation.organisation_id = :organisationId', { organisationId })
      .andWhere('progress.date_creation BETWEEN :start AND :end', { start, end })
      .groupBy('user.users_id')
      .getRawMany();

    return users.map(user => ({
      ...user,
      completionRate: user.totalProgress > 0 ? (user.completedProgress / user.totalProgress * 100).toFixed(2) : 0,
      avgProgress: parseFloat(user.avgProgress || '0').toFixed(2),
    }));
  }

  async getOrganisationLearningPathStats(organisationId: number, start: Date, end: Date) {
    return this.learningPathRepository
      .createQueryBuilder('path')
      .select('path.parcours_id', 'id')
      .addSelect('path.titre', 'title')
      .addSelect('path.description', 'description')
      .addSelect('COUNT(DISTINCT progress.progression_id)', 'totalProgress')
      .addSelect('COUNT(DISTINCT CASE WHEN progress.statut = "termine" THEN progress.progression_id END)', 'completedProgress')
      .addSelect('AVG(progress.score)', 'avgProgress')
      .addSelect('MIN(progress.date_creation)', 'firstStarted')
      .addSelect('MAX(progress.date_maj)', 'lastActivity')
      .leftJoin('path.modules', 'module')
      .leftJoin('module.progressions', 'progress')
      .leftJoin('progress.utilisateur', 'user')
      .where('user.organisation.organisation_id = :organisationId', { organisationId })
      .andWhere('progress.date_creation BETWEEN :start AND :end', { start, end })
      .groupBy('path.parcours_id')
      .getRawMany();
  }

  async getOrganisationCertificationStats(organisationId: number, start: Date, end: Date) {
    return this.certificationRepository
      .createQueryBuilder('cert')
      .select('cert.certification_id', 'id')
      .addSelect('cert.titre', 'title')
      .addSelect('cert.type', 'type')
      .addSelect('cert.date_obtention', 'obtainedAt')
      .leftJoin('cert.utilisateur', 'user')
      .where('user.organisation.organisation_id = :organisationId', { organisationId })
      .andWhere('cert.date_obtention BETWEEN :start AND :end', { start, end })
      .getMany();
  }

  async getOrganisationActivityTimeline(organisationId: number, start: Date, end: Date) {
    return this.progressRepository
      .createQueryBuilder('progress')
      .select('DATE(progress.date_creation)', 'date')
      .addSelect('COUNT(*)', 'activities')
      .addSelect('COUNT(DISTINCT progress.utilisateur.users_id)', 'activeUsers')
      .leftJoin('progress.utilisateur', 'user')
      .where('user.organisation.organisation_id = :organisationId', { organisationId })
      .andWhere('progress.date_creation BETWEEN :start AND :end', { start, end })
      .groupBy('DATE(progress.date_creation)')
      .orderBy('date', 'ASC')
      .getRawMany();
  }

  async getSystemHealthReport() {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      totalOrganisations,
      activeOrganisations,
      totalLearningPaths,
      totalModules,
      totalProgress,
      completedProgress,
      totalCertifications,
      systemUptime,
    ] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { date_maj: MoreThanOrEqual(lastWeek) } }),
      this.organisationRepository.count(),
      this.organisationRepository.count({ where: { date_maj: MoreThanOrEqual(lastWeek) } }),
      this.learningPathRepository.count(),
      this.moduleRepository.count(),
      this.progressRepository.count(),
      this.progressRepository.count({ where: { statut: ProgressStatus.TERMINE } }),
      this.certificationRepository.count(),
      this.calculateSystemUptime(),
    ]);

    return {
      metrics: {
        totalUsers,
        activeUsers,
        userActivityRate: totalUsers > 0 ? (activeUsers / totalUsers * 100).toFixed(2) : 0,
        totalOrganisations,
        activeOrganisations,
        organisationActivityRate: totalOrganisations > 0 ? (activeOrganisations / totalOrganisations * 100).toFixed(2) : 0,
        totalLearningPaths,
        totalModules,
        totalProgress,
        completedProgress,
        completionRate: totalProgress > 0 ? (completedProgress / totalProgress * 100).toFixed(2) : 0,
        totalCertifications,
      },
      system: {
        uptime: systemUptime,
        lastCheck: now,
      },
    };
  }

  private async calculateSystemUptime(): Promise<string> {
    // Simulation d'un calcul d'uptime - dans un vrai système, cela viendrait d'un monitoring
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    
    return `${days}d ${hours}h ${minutes}m`;
  }

  async exportReport(query: AnalyticsQueryDto & { format: string }) {
    const dashboard = await this.getGlobalDashboard(query);
    
    // Simulation d'export - dans un vrai système, cela générerait un fichier
    return {
      format: query.format,
      data: dashboard,
      generatedAt: new Date(),
      filename: `analytics-report-${new Date().toISOString().split('T')[0]}.${query.format}`,
    };
  }
}

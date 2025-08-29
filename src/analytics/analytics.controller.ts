import { Controller, Get, Post, Query, Param, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto, DashboardQueryDto, ExportQueryDto, TimeRange } from './dto/analytics.dto';

@ApiTags('Analytics & Reporting')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @Roles('superadmin')
  @ApiOperation({ summary: 'Obtenir le tableau de bord global du système' })
  @ApiResponse({ status: 200, description: 'Tableau de bord récupéré avec succès' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Superadmin requis' })
  async getGlobalDashboard(@Query() query: DashboardQueryDto) {
    return this.analyticsService.getGlobalDashboard(query);
  }

  @Get('organisations/:id/report')
  @Roles('superadmin')
  @ApiOperation({ summary: 'Obtenir un rapport détaillé pour une organisation spécifique' })
  @ApiParam({ name: 'id', description: 'ID de l\'organisation' })
  @ApiResponse({ status: 200, description: 'Rapport d\'organisation récupéré avec succès' })
  @ApiResponse({ status: 404, description: 'Organisation non trouvée' })
  async getOrganisationReport(
    @Param('id') organisationId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getDetailedOrganisationReport(parseInt(organisationId), query);
  }

  @Get('system/health')
  @Roles('superadmin')
  @ApiOperation({ summary: 'Obtenir le rapport de santé du système' })
  @ApiResponse({ status: 200, description: 'Rapport de santé récupéré avec succès' })
  async getSystemHealth() {
    return this.analyticsService.getSystemHealthReport();
  }

  @Get('trends/users')
  @Roles('superadmin')
  @ApiOperation({ summary: 'Obtenir les tendances de croissance des utilisateurs' })
  @ApiResponse({ status: 200, description: 'Tendances utilisateurs récupérées avec succès' })
  async getUserTrends(@Query() query: AnalyticsQueryDto) {
    const { start, end } = this.analyticsService['getDateRange'](query.timeRange || TimeRange.MONTH, query.startDate, query.endDate);
    return this.analyticsService.getUserGrowth(start, end);
  }

  @Get('trends/organisations')
  @Roles('superadmin')
  @ApiOperation({ summary: 'Obtenir les statistiques des organisations' })
  @ApiResponse({ status: 200, description: 'Statistiques organisations récupérées avec succès' })
  async getOrganisationTrends(@Query() query: AnalyticsQueryDto) {
    const { start, end } = this.analyticsService['getDateRange'](query.timeRange || TimeRange.MONTH, query.startDate, query.endDate);
    return this.analyticsService.getOrganisationStats(start, end);
  }

  @Get('trends/learning-paths')
  @Roles('superadmin')
  @ApiOperation({ summary: 'Obtenir les statistiques des parcours d\'apprentissage' })
  @ApiResponse({ status: 200, description: 'Statistiques parcours récupérées avec succès' })
  async getLearningPathTrends(@Query() query: AnalyticsQueryDto) {
    const { start, end } = this.analyticsService['getDateRange'](query.timeRange || TimeRange.MONTH, query.startDate, query.endDate);
    return this.analyticsService.getLearningPathStats(start, end);
  }

  @Get('trends/certifications')
  @Roles('superadmin')
  @ApiOperation({ summary: 'Obtenir les statistiques des certifications' })
  @ApiResponse({ status: 200, description: 'Statistiques certifications récupérées avec succès' })
  async getCertificationTrends(@Query() query: AnalyticsQueryDto) {
    const { start, end } = this.analyticsService['getDateRange'](query.timeRange || TimeRange.MONTH, query.startDate, query.endDate);
    return this.analyticsService.getCertificationStats(start, end);
  }

  @Get('top-performers/organisations')
  @Roles('superadmin')
  @ApiOperation({ summary: 'Obtenir les organisations les plus performantes' })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre d\'organisations à retourner', type: Number })
  @ApiResponse({ status: 200, description: 'Top organisations récupérées avec succès' })
  async getTopOrganisations(@Query('limit') limit: number = 10) {
    return this.analyticsService.getTopPerformingOrganisations(limit);
  }

  @Get('top-performers/learning-paths')
  @Roles('superadmin')
  @ApiOperation({ summary: 'Obtenir les parcours d\'apprentissage les plus populaires' })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre de parcours à retourner', type: Number })
  @ApiResponse({ status: 200, description: 'Top parcours récupérés avec succès' })
  async getTopLearningPaths(@Query('limit') limit: number = 10) {
    return this.analyticsService.getTopLearningPaths(limit);
  }

  @Post('export')
  @Roles('superadmin')
  @ApiOperation({ summary: 'Exporter un rapport d\'analytics' })
  @ApiResponse({ status: 200, description: 'Rapport exporté avec succès' })
  async exportReport(@Query() query: ExportQueryDto, @Res() res: Response) {
    const report = await this.analyticsService.exportReport(query);
    
    // Simulation d'export - dans un vrai système, cela générerait un fichier réel
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);
    res.json(report);
  }

  @Get('realtime/activity')
  @Roles('superadmin')
  @ApiOperation({ summary: 'Obtenir l\'activité en temps réel du système' })
  @ApiResponse({ status: 200, description: 'Activité temps réel récupérée avec succès' })
  async getRealtimeActivity() {
    // Simulation d'activité en temps réel
    const now = new Date();
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
    
    return {
      timestamp: now,
      activeUsers: Math.floor(Math.random() * 100) + 10,
      recentActivities: [
        { type: 'user_login', count: Math.floor(Math.random() * 50) + 5 },
        { type: 'module_completed', count: Math.floor(Math.random() * 20) + 2 },
        { type: 'certification_obtained', count: Math.floor(Math.random() * 10) + 1 },
      ],
      systemLoad: {
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        database: Math.random() * 100,
      },
    };
  }

  @Get('predictions/engagement')
  @Roles('superadmin')
  @ApiOperation({ summary: 'Obtenir les prédictions d\'engagement' })
  @ApiResponse({ status: 200, description: 'Prédictions récupérées avec succès' })
  async getEngagementPredictions() {
    // Simulation de prédictions basées sur les données historiques
    return {
      nextWeek: {
        expectedNewUsers: Math.floor(Math.random() * 100) + 20,
        expectedCompletions: Math.floor(Math.random() * 200) + 50,
        expectedCertifications: Math.floor(Math.random() * 50) + 10,
      },
      nextMonth: {
        expectedNewUsers: Math.floor(Math.random() * 500) + 100,
        expectedCompletions: Math.floor(Math.random() * 1000) + 200,
        expectedCertifications: Math.floor(Math.random() * 200) + 50,
      },
      trends: {
        userGrowth: 'increasing',
        completionRate: 'stable',
        certificationRate: 'increasing',
      },
    };
  }

  @Get('comparative/periods')
  @Roles('superadmin')
  @ApiOperation({ summary: 'Comparer les performances entre différentes périodes' })
  @ApiQuery({ name: 'period1', required: true, description: 'Première période (YYYY-MM-DD)' })
  @ApiQuery({ name: 'period2', required: true, description: 'Deuxième période (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Comparaison récupérée avec succès' })
  async comparePeriods(
    @Query('period1') period1: string,
    @Query('period2') period2: string,
  ) {
    const [start1, end1] = period1.split('/');
    const [start2, end2] = period2.split('/');
    
    const query1: AnalyticsQueryDto = { startDate: start1, endDate: end1 };
    const query2: AnalyticsQueryDto = { startDate: start2, endDate: end2 };
    
    const [dashboard1, dashboard2] = await Promise.all([
      this.analyticsService.getGlobalDashboard(query1),
      this.analyticsService.getGlobalDashboard(query2),
    ]);
    
    return {
      period1: { start: start1, end: end1, data: dashboard1 },
      period2: { start: start2, end: end2, data: dashboard2 },
      comparison: {
        userGrowth: this.calculateGrowth(dashboard1.overview.newUsers, dashboard2.overview.newUsers),
        completionRateGrowth: this.calculateGrowth(
          parseFloat(dashboard1.overview.completionRate as string),
          parseFloat(dashboard2.overview.completionRate as string)
        ),
        activityGrowth: this.calculateGrowth(dashboard1.overview.totalProgress, dashboard2.overview.totalProgress),
      },
    };
  }

  private calculateGrowth(value1: number, value2: number): number {
    if (value1 === 0) return value2 > 0 ? 100 : 0;
    return ((value2 - value1) / value1 * 100);
  }
}

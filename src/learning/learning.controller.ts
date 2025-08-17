import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { LearningService } from './learning.service';
import { LearningPath } from './entities/learning-path.entity';
import { LearningPathModule } from './entities/learning-module.entity';
import { MediaContent } from './entities/media-content.entity';
import { Certification } from './entities/certification.entity';
import { Progress } from './entities/progress.entity';
import { OrganisationLearningPath } from './entities/organisation-learning-path.entity';

@Controller('learning')
export class LearningController {
  constructor(private readonly learningService: LearningService) {}

  // ===== PARCOURS D'APPRENTISSAGE =====

  @Post('parcours')
  async createLearningPath(@Body() learningPathData: Partial<LearningPath>): Promise<LearningPath> {
    return await this.learningService.createLearningPath(learningPathData);
  }

  @Get('parcours')
  async getAllLearningPaths(): Promise<LearningPath[]> {
    return await this.learningService.getAllLearningPaths();
  }

  @Get('parcours/:id')
  async getLearningPathById(@Param('id') id: string): Promise<LearningPath> {
    return await this.learningService.getLearningPathById(+id);
  }

  @Get('parcours/user/available')
  async getUserAvailableLearningPaths(@Request() req): Promise<LearningPath[]> {
    const userId = req.user?.users_id;
    if (!userId) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }
    return await this.learningService.getUserAvailableLearningPaths(userId);
  }

  // ===== MODULES D'APPRENTISSAGE =====

  @Post('modules')
  async createLearningModule(@Body() moduleData: Partial<LearningPathModule>): Promise<LearningPathModule> {
    return await this.learningService.createLearningModule(moduleData);
  }

  @Get('parcours/:parcoursId/modules')
  async getModulesByLearningPath(@Param('parcoursId') parcoursId: string): Promise<LearningPathModule[]> {
    return await this.learningService.getModulesByLearningPath(+parcoursId);
  }

  // ===== CONTENUS MÉDIAS =====

  @Post('media')
  async createMediaContent(@Body() mediaData: Partial<MediaContent>): Promise<MediaContent> {
    return await this.learningService.createMediaContent(mediaData);
  }

  @Get('modules/:moduleId/media')
  async getMediaContentByModule(@Param('moduleId') moduleId: string): Promise<MediaContent[]> {
    return await this.learningService.getMediaContentByModule(+moduleId);
  }

  // ===== PROGRESSIONS =====

  @Post('progress')
  async createProgress(@Body() progressData: Partial<Progress>): Promise<Progress> {
    return await this.learningService.createProgress(progressData);
  }

  @Put('progress/:id')
  async updateProgress(
    @Param('id') id: string,
    @Body() progressData: Partial<Progress>,
  ): Promise<Progress> {
    return await this.learningService.updateProgress(+id, progressData);
  }

  @Get('progress/user')
  async getUserProgress(@Request() req): Promise<Progress[]> {
    const userId = req.user?.users_id;
    if (!userId) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }
    return await this.learningService.getUserProgress(userId);
  }

  @Get('progress/user/:moduleId')
  async getModuleProgress(
    @Request() req,
    @Param('moduleId') moduleId: string,
  ): Promise<Progress> {
    const userId = req.user?.users_id;
    if (!userId) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }
    return await this.learningService.getModuleProgress(userId, +moduleId);
  }

  // ===== CERTIFICATIONS =====

  @Post('certifications')
  async createCertification(@Body() certificationData: Partial<Certification>): Promise<Certification> {
    return await this.learningService.createCertification(certificationData);
  }

  @Get('certifications/user')
  async getUserCertifications(@Request() req): Promise<Certification[]> {
    const userId = req.user?.users_id;
    if (!userId) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }
    return await this.learningService.getUserCertifications(userId);
  }

  // ===== GESTION DES PARCOURS PAR ORGANISATION =====

  @Post('organisations/:organisationId/parcours/:parcoursId')
  async addLearningPathToOrganisation(
    @Param('organisationId') organisationId: string,
    @Param('parcoursId') parcoursId: string,
  ): Promise<OrganisationLearningPath> {
    return await this.learningService.addLearningPathToOrganisation(+organisationId, +parcoursId);
  }

  @Delete('organisations/:organisationId/parcours/:parcoursId')
  async removeLearningPathFromOrganisation(
    @Param('organisationId') organisationId: string,
    @Param('parcoursId') parcoursId: string,
  ): Promise<{ message: string }> {
    await this.learningService.removeLearningPathFromOrganisation(+organisationId, +parcoursId);
    return { message: 'Parcours retiré de l\'organisation avec succès' };
  }

  @Get('organisations/:organisationId/parcours')
  async getOrganisationLearningPaths(@Param('organisationId') organisationId: string): Promise<LearningPath[]> {
    return await this.learningService.getOrganisationLearningPaths(+organisationId);
  }

  // ===== VÉRIFICATION D'ACCÈS =====

  @Get('access/check/:parcoursId')
  async checkUserAccessToLearningPath(
    @Request() req,
    @Param('parcoursId') parcoursId: string,
  ): Promise<{ hasAccess: boolean }> {
    const userId = req.user?.users_id;
    if (!userId) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }
    const hasAccess = await this.learningService.checkUserAccessToLearningPath(userId, +parcoursId);
    return { hasAccess };
  }
}

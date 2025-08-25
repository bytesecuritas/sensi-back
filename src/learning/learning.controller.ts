import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    ForbiddenException,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Put,
    Query,
    Request,
    Response,
    UploadedFile,
    UseGuards,
    UseInterceptors,
    ValidationPipe
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import * as fs from 'fs';
import { diskStorage } from 'multer';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateLearningModuleDto } from './dto/create-learning-module.dto';
import { CreateMediaContentDto } from './dto/create-media-content.dto';
import { UploadMediaContentDto } from './dto/upload-media-content.dto';
import { Certification } from './entities/certification.entity';
import { LearningPathModule } from './entities/learning-module.entity';
import { LearningPath } from './entities/learning-path.entity';
import { MediaContent } from './entities/media-content.entity';
import { OrganisationLearningPath } from './entities/organisation-learning-path.entity';
import { Progress } from './entities/progress.entity';
import { LearningService } from './learning.service';

@ApiTags('Media')
@Controller('learning')
@UseGuards(JwtAuthGuard)
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

    // ===== SUPPRESSION ET MISE À JOUR PARCOURS =====

  @Delete('parcours/:id')
  async deleteLearningPath(@Param('id') id: string): Promise<{ message: string }> {
    await this.learningService.deleteLearningPath(+id);
    return { message: 'Parcours supprimé avec succès (modules et médias associés également supprimés)' };
  }

  // ===== MODULES D'APPRENTISSAGE =====

  @Post('modules')
  async createLearningModule(@Body() moduleData: CreateLearningModuleDto): Promise<LearningPathModule> {
    return await this.learningService.createLearningModule(moduleData);
  }

  @Get('parcours/:parcoursId/modules')
  async getModulesByLearningPath(@Param('parcoursId') parcoursId: string): Promise<LearningPathModule[]> {
    return await this.learningService.getModulesByLearningPath(+parcoursId);
  }

  // ===== MISE À JOUR MODULE =====

  @Put('modules/:id')
  async updateLearningModule(
    @Param('id') id: string,
    @Body() moduleData: Partial<LearningPathModule>
  ): Promise<LearningPathModule> {
    return await this.learningService.updateLearningModule(+id, moduleData);
  }

  // ===== SUPPRESSION MODULE =====

  @Delete('modules/:id')
  async deleteLearningModule(@Param('id') id: string): Promise<{ message: string }> {
    await this.learningService.deleteLearningModule(+id, true);
    return { message: 'Module supprimé avec succès (médias associés également supprimés)' };
  }

  // Les méthodes pour les contenus médias
  @Post('media/upload')
  @ApiOperation({ summary: 'Upload a media file' })
  @ApiResponse({ status: 201, description: 'Media uploaded successfully', type: MediaContent })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const dest = path.join(process.cwd(), 'ressources/temp');
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true });
        }
        cb(null, dest);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
        const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        cb(null, `${uniqueSuffix}-${cleanFileName}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      const allowedMimes = ['image/jpeg', 'image/png', 'video/mp4', 'application/pdf'];
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Invalid file type'), false);
      }
    },
  }))
  async uploadMediaContent(
    @UploadedFile() file: Express.Multer.File,
    @Query('module_id', ParseIntPipe) moduleId: number,
    @Body(new ValidationPipe({ transform: true })) mediaData: UploadMediaContentDto
  ): Promise<MediaContent> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    
    // Logs pour debugger
    console.log('Received mediaData:', mediaData);
    console.log('Module ID from ParseIntPipe:', moduleId);
    console.log('Type of moduleId:', typeof moduleId);

    const module = await this.learningService.getModuleById(moduleId);
    if(!module) {
      throw new BadRequestException('Module not found');
    }

    const thematique = (module.thematique_cyber || 'INCONNU').replace(/[^a-zA-Z0-9-_]/g, '_');
    const nomModule = module.titre.replace(/[^a-zA-Z0-9-_]/g, '_');
    const destDir = path.join(process.cwd(), `ressources/${thematique}/${nomModule}`);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    const tempPath = path.join(process.cwd(), 'ressources/temp', file.filename);
    const finalPath = path.join(destDir, file.filename);

    try {
      fs.renameSync(tempPath, finalPath);
      
      // Créer l'objet complet pour le service
      const completeMediaData: CreateMediaContentDto = {
        ...mediaData,
        module_id: moduleId, // Utiliser le moduleId extrait par ParseIntPipe
        chemin_stockage: `ressources/${thematique}/${nomModule}/${file.filename}`,
        nom_fichier: file.originalname,
        taille_fichier: file.size,
        url_fichier: '', // À implémenter si nécessaire
      };

      return await this.learningService.createMediaContent(completeMediaData);
    } catch (error) {
      if (fs.existsSync(finalPath)) {
        fs.unlinkSync(finalPath);
      }
      throw error;
    }
  }

  @Put('media/:id/upload')
  @ApiOperation({ summary: 'Update a media file' })
  @ApiResponse({ status: 200, description: 'Media updated successfully', type: MediaContent })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Media not found' })
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const dest = path.join(process.cwd(), 'ressources/temp');
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true });
        }
        cb(null, dest);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
        const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        cb(null, `${uniqueSuffix}-${cleanFileName}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      const allowedMimes = ['image/jpeg', 'image/png', 'video/mp4', 'application/pdf'];
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Invalid file type'), false);
      }
    },
  }))
  async updateMediaContent(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('module_id', ParseIntPipe) moduleId: number,
    @Body(new ValidationPipe()) mediaData: UploadMediaContentDto
  ): Promise<MediaContent> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const module = await this.learningService.getModuleById(moduleId);

    if (!module) {
      throw new BadRequestException('Module not found');
    }

    const thematique = (module.thematique_cyber || 'INCONNU').replace(/[^a-zA-Z0-9-_]/g, '_');
    const nomModule = module.titre.replace(/[^a-zA-Z0-9-_]/g, '_');
    const destDir = path.join(process.cwd(), `ressources/${thematique}/${nomModule}`);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    const tempPath = path.join(process.cwd(), 'ressources/temp', file.filename);
    const finalPath = path.join(destDir, file.filename);

    try {
      fs.renameSync(tempPath, finalPath);
      
      // Créer l'objet complet pour le service
      const completeMediaData: CreateMediaContentDto = {
        ...mediaData,
        module_id: moduleId, // Utiliser le moduleId extrait par ParseIntPipe
        chemin_stockage: `ressources/${thematique}/${nomModule}/${file.filename}`,
        nom_fichier: file.originalname,
        taille_fichier: file.size,
        url_fichier: '', // À implémenter si nécessaire
      };

      return await this.learningService.updateMediaContent(+id, completeMediaData);
    } catch (error) {
      if (fs.existsSync(finalPath)) {
        fs.unlinkSync(finalPath);
      }
      throw error;
    }
  }

  // ===== SUPPRESSION MEDIA =====

  @Delete('media/:id')
  async deleteMediaContent(@Param('id') id: string): Promise<{ message: string }> {
    await this.learningService.deleteMediaContent(+id);
    return { message: 'Media supprimé avec succès (fichier associé également supprimé)' };
  }

  @Get('modules/:moduleId/media')
  async getMediaContentByModule(@Param('moduleId') moduleId: string): Promise<MediaContent[]> {
    return await this.learningService.getMediaContentByModule(+moduleId);
  }

  @Get('media/:mediaId/stream')
  async streamMediaContent(@Param('mediaId') mediaId: string, @Request() req, @Response() res) {
    const media = await this.learningService.getMediaContentById(+mediaId);
    if (!media) {
      throw new BadRequestException('Media not found');
    }

    const filePath = path.join(process.cwd(), media.chemin_stockage);
    
    if (!fs.existsSync(filePath)) {
      throw new BadRequestException('File not found');
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
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
    console.log('getUserProgress called - req.user:', req.user);
    const userId = req.user?.users_id;
    console.log('Extracted userId:', userId);
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
    console.log('getModuleProgress called - req.user:', req.user, 'moduleId:', moduleId);
    const userId = req.user?.users_id;
    console.log('Extracted userId:', userId);
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

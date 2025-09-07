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
    ValidationPipe,
    Patch
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import * as fs from 'fs';
import { diskStorage } from 'multer';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateLearningModuleDto } from './dto/create-learning-module.dto';
import { CreateMediaContentDto } from './dto/create-media-content.dto';
import { UploadMediaContentDto } from './dto/upload-media-content.dto';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { SubmitQuizResponseDto } from './dto/submit-quiz-response.dto';
import { Certification } from './entities/certification.entity';
import { LearningPathModule } from './entities/learning-module.entity';
import { LearningPath } from './entities/learning-path.entity';
import { MediaContent } from './entities/media-content.entity';
import { OrganisationLearningPath } from './entities/organisation-learning-path.entity';
import { Progress } from './entities/progress.entity';
import { LearningService } from './learning.service';
import { UpdateOrganisationLearningPathDto } from './dto/update-organisation-learning-path.dto';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';

@ApiTags('Learning')
@ApiBearerAuth('bearer')
@Controller('learning')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LearningController {
  constructor(private readonly learningService: LearningService) {}

  // ===== PARCOURS D'APPRENTISSAGE =====

  @Post('parcours')
  @ApiOperation({ summary: 'Créer un parcours', description: 'Crée un nouveau parcours d’apprentissage.' })
  @ApiResponse({ status: 201, description: 'Parcours créé', type: LearningPath })
  @Roles('superadmin')
  async createLearningPath(@Body() learningPathData: Partial<LearningPath>): Promise<LearningPath> {
    return await this.learningService.createLearningPath(learningPathData);
  }

  @Get('parcours')
  @ApiOperation({ summary: 'Lister les parcours' })
  @ApiResponse({ status: 200, description: 'Liste des parcours', type: [LearningPath] })
  async getAllLearningPaths(): Promise<LearningPath[]> {
    return await this.learningService.getAllLearningPaths();
  }

  @Get('parcours/:id')
  @ApiOperation({ summary: 'Détail d’un parcours' })
  @ApiParam({ name: 'id', type: String })
  async getLearningPathById(@Param('id') id: string): Promise<LearningPath> {
    return await this.learningService.getLearningPathById(+id);
  }

  @Get('parcours/user/available')
  @ApiOperation({ summary: 'Parcours disponibles pour l’utilisateur courant' })
  async getUserAvailableLearningPaths(@Request() req): Promise<LearningPath[]> {
    const userId = req.user?.users_id;
    if (!userId) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }
    return await this.learningService.getUserAvailableLearningPaths(userId);
  }

    // ===== SUPPRESSION ET MISE À JOUR PARCOURS =====

  @Delete('parcours/:id')
  @ApiOperation({ summary: 'Supprimer un parcours (cascade modules et médias)' })
  @ApiParam({ name: 'id', type: String })
  @Roles('superadmin')
  async deleteLearningPath(@Param('id') id: string): Promise<{ message: string }> {
    await this.learningService.deleteLearningPath(+id);
    return { message: 'Parcours supprimé avec succès (modules et médias associés également supprimés)' };
  }

  // ===== MODULES D'APPRENTISSAGE =====

  @Post('modules')
  @ApiOperation({ summary: 'Créer un module' })
  @ApiResponse({ status: 201, description: 'Module créé', type: LearningPathModule })
  @Roles('superadmin')
  async createLearningModule(@Body() moduleData: CreateLearningModuleDto): Promise<LearningPathModule> {
    return await this.learningService.createLearningModule(moduleData);
  }

  @Get('modules')
  @ApiOperation({ summary: 'Lister tous les modules' })
  @ApiResponse({ status: 200, description: 'Liste des modules', type: [LearningPathModule] })
  async getAllLearningModules(): Promise<LearningPathModule[]> {
    return await this.learningService.getAllLearningModules();
  }

  @Get('modules/:id')
  @ApiOperation({ summary: 'Obtenir un module spécifique' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Module trouvé', type: LearningPathModule })
  async getLearningModuleById(@Param('id') id: string): Promise<LearningPathModule> {
    return await this.learningService.getLearningModuleById(+id);
  }

  @Get('parcours/:parcoursId/modules')
  @ApiOperation({ summary: 'Lister les modules d’un parcours' })
  @ApiParam({ name: 'parcoursId', type: String })
  async getModulesByLearningPath(@Param('parcoursId') parcoursId: string): Promise<LearningPathModule[]> {
    return await this.learningService.getModulesByLearningPath(+parcoursId);
  }

  // ===== MISE À JOUR MODULE =====

  @Put('modules/:id')
  @ApiOperation({ summary: 'Mettre à jour un module' })
  @ApiParam({ name: 'id', type: String })
  @Roles('superadmin')
  async updateLearningModule(
    @Param('id') id: string,
    @Body() moduleData: Partial<LearningPathModule>
  ): Promise<LearningPathModule> {
    return await this.learningService.updateLearningModule(+id, moduleData);
  }

  // ===== SUPPRESSION MODULE =====

  @Delete('modules/:id')
  @ApiOperation({ summary: 'Supprimer un module' })
  @ApiParam({ name: 'id', type: String })
  @Roles('superadmin')
  async deleteLearningModule(@Param('id') id: string): Promise<{ message: string }> {
    await this.learningService.deleteLearningModule(+id, true);
    return { message: 'Module supprimé avec succès (médias associés également supprimés)' };
  }

  // Les méthodes pour les contenus médias
  @Post('media/upload')
  @ApiOperation({ summary: 'Uploader un média', description: 'Charge un fichier média et le rattache à un module.' })
  @ApiResponse({ status: 201, description: 'Media uploaded successfully', type: MediaContent })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({ name: 'module_id', type: Number, required: true })
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @Roles('superadmin')
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
      console.log('File upload attempt:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      });
      
      const allowedMimes = ['image/jpeg', 'image/png', 'video/mp4', 'application/pdf'];
      
      // Vérification plus souple pour les PDF
      const isPdf = file.mimetype === 'application/pdf' || 
                   file.originalname.toLowerCase().endsWith('.pdf') ||
                   file.mimetype.includes('pdf');
      
      const isAllowed = allowedMimes.includes(file.mimetype) || isPdf;
      
      if (isAllowed) {
        console.log('File accepted:', file.originalname);
        cb(null, true);
      } else {
        console.log('File rejected:', file.originalname, 'MIME type:', file.mimetype);
        cb(new BadRequestException(`Invalid file type: ${file.mimetype}. Allowed: ${allowedMimes.join(', ')}`), false);
      }
    },
  }))
  async uploadMediaContent(
    @UploadedFile() file: Express.Multer.File,
    @Query('module_id', ParseIntPipe) moduleId: number,
    @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: false })) mediaData: UploadMediaContentDto
  ): Promise<MediaContent> {
    console.log('uploadMediaContent called with:', {
      file: file ? {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        filename: file.filename
      } : null,
      moduleId,
      mediaData
    });
    
    if (!file) {
      console.log('No file received in uploadMediaContent');
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
      const { module_id, ...mediaDataWithoutModuleId } = mediaData as any;
      const completeMediaData: CreateMediaContentDto = {
        ...mediaDataWithoutModuleId,
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
  @ApiOperation({ summary: 'Mettre à jour un fichier média' })
  @ApiResponse({ status: 200, description: 'Media updated successfully', type: MediaContent })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Media not found' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', type: String })
  @ApiQuery({ name: 'module_id', type: Number, required: true })
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @Roles('superadmin')
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
      console.log('File upload attempt (update):', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      });
      
      const allowedMimes = ['image/jpeg', 'image/png', 'video/mp4', 'application/pdf'];
      
      // Vérification plus souple pour les PDF
      const isPdf = file.mimetype === 'application/pdf' || 
                   file.originalname.toLowerCase().endsWith('.pdf') ||
                   file.mimetype.includes('pdf');
      
      const isAllowed = allowedMimes.includes(file.mimetype) || isPdf;
      
      if (isAllowed) {
        console.log('File accepted (update):', file.originalname);
        cb(null, true);
      } else {
        console.log('File rejected (update):', file.originalname, 'MIME type:', file.mimetype);
        cb(new BadRequestException(`Invalid file type: ${file.mimetype}. Allowed: ${allowedMimes.join(', ')}`), false);
      }
    },
  }))
  async updateMediaContent(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('module_id', ParseIntPipe) moduleId: number,
    @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: false })) mediaData: UploadMediaContentDto
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
      const { module_id, ...mediaDataWithoutModuleId } = mediaData as any;
      const completeMediaData: CreateMediaContentDto = {
        ...mediaDataWithoutModuleId,
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
  @ApiOperation({ summary: 'Supprimer un média' })
  @ApiParam({ name: 'id', type: String })
  @Roles('superadmin')
  async deleteMediaContent(@Param('id') id: string): Promise<{ message: string }> {
    await this.learningService.deleteMediaContent(+id);
    return { message: 'Media supprimé avec succès (fichier associé également supprimé)' };
  }

  @Get('modules/:moduleId/media')
  @ApiOperation({ summary: 'Lister les médias d’un module' })
  @ApiParam({ name: 'moduleId', type: String })
  async getMediaContentByModule(@Param('moduleId') moduleId: string): Promise<MediaContent[]> {
    return await this.learningService.getMediaContentByModule(+moduleId);
  }

  @Get('media/:mediaId/stream')
  @ApiOperation({ summary: 'Streamer un média (supporte HTTP Range)' })
  @ApiParam({ name: 'mediaId', type: String })
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
  // La progression est dérivée automatiquement des réponses aux quiz.
  // Aucune création/mise à jour directe via HTTP n'est exposée.

  @Get('progress/user')
  @ApiOperation({ summary: 'Progressions de l\'utilisateur courant' })
  async getUserProgress(@Request() req): Promise<Progress[]> {
    console.log('getUserProgress called - req.user:', req.user);
    const userId = req.user?.users_id;
    console.log('Extracted userId:', userId);
    if (!userId) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }
    return await this.learningService.getUserProgress(userId);
  }

  @Get('progress/parcours/:parcoursId')
  @ApiOperation({ summary: 'Progression de l\'utilisateur pour un parcours' })
  @ApiParam({ name: 'parcoursId', type: String })
  async getParcoursProgress(
    @Request() req,
    @Param('parcoursId') parcoursId: string,
  ): Promise<Progress> {
    console.log('getParcoursProgress called - req.user:', req.user, 'parcoursId:', parcoursId);
    const userId = req.user?.users_id;
    console.log('Extracted userId:', userId);
    if (!userId) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }
    return await this.learningService.getParcoursProgress(userId, +parcoursId);
  }

  // ===== CERTIFICATIONS =====

  @Post('certifications')
  @ApiOperation({ summary: 'Créer une certification' })
  async createCertification(@Body() certificationData: Partial<Certification>): Promise<Certification> {
    return await this.learningService.createCertification(certificationData);
  }

  @Get('certifications/user')
  @ApiOperation({ summary: 'Certifications de l’utilisateur courant' })
  async getUserCertifications(@Request() req): Promise<Certification[]> {
    const userId = req.user?.users_id;
    if (!userId) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }
    return await this.learningService.getUserCertifications(userId);
  }

  // ===== GESTION DES PARCOURS PAR ORGANISATION =====

  @Post('organisations/:organisationId/parcours/:parcoursId')
  @ApiOperation({ summary: 'Associer un parcours à une organisation' })
  @ApiParam({ name: 'organisationId', type: String })
  @ApiParam({ name: 'parcoursId', type: String })
  @Roles('superadmin')
  async addLearningPathToOrganisation(
    @Param('organisationId') organisationId: string,
    @Param('parcoursId') parcoursId: string,
  ): Promise<OrganisationLearningPath> {
    return await this.learningService.addLearningPathToOrganisation(+organisationId, +parcoursId);
  }

  @Delete('organisations/:organisationId/parcours/:parcoursId')
  @ApiOperation({ summary: 'Retirer un parcours d’une organisation' })
  @ApiParam({ name: 'organisationId', type: String })
  @ApiParam({ name: 'parcoursId', type: String })
  @Roles('superadmin')
  async removeLearningPathFromOrganisation(
    @Param('organisationId') organisationId: string,
    @Param('parcoursId') parcoursId: string,
  ): Promise<{ message: string }> {
    await this.learningService.removeLearningPathFromOrganisation(+organisationId, +parcoursId);
    return { message: 'Parcours retiré de l\'organisation avec succès' };
  }

  @Patch('organisations/:organisationId/parcours/:parcoursId')
  @ApiOperation({ summary: 'Désactiver/activer un parcours pour une organisation' })
  @ApiParam({ name: 'organisationId', type: String })
  @ApiParam({ name: 'parcoursId', type: String })
  @ApiResponse({ status: 200, description: 'Parcours mis à jour', type: OrganisationLearningPath })
  @Roles('superadmin')
  async updateOrganisationLearningPath(
    @Param('organisationId') organisationId: string,
    @Param('parcoursId') parcoursId: string,
    @Body() updateData: UpdateOrganisationLearningPathDto
  ): Promise<OrganisationLearningPath> {
    return await this.learningService.updateOrganisationLearningPath(+organisationId, +parcoursId, updateData);
  }

  @Get('organisations/:organisationId/parcours')
  @ApiOperation({ summary: 'Lister les parcours d’une organisation' })
  @ApiParam({ name: 'organisationId', type: String })
  async getOrganisationLearningPaths(@Param('organisationId') organisationId: string): Promise<LearningPath[]> {
    return await this.learningService.getOrganisationLearningPaths(+organisationId);
  }

  // ===== VÉRIFICATION D'ACCÈS =====

  @Get('access/check/:parcoursId')
  @ApiOperation({ summary: 'Vérifier l’accès de l’utilisateur à un parcours' })
  @ApiParam({ name: 'parcoursId', type: String })
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

  // ==================== ROUTES POUR LES QUIZ ====================

  @Post('modules/:moduleId/quiz')
  @ApiOperation({ summary: 'Créer un quiz pour un module' })
  @ApiParam({ name: 'moduleId', type: String })
  @ApiResponse({ status: 201, description: 'Quiz créé' })
  @Roles('superadmin')
  async createQuiz(
    @Param('moduleId') moduleId: string,
    @Body() quizData: CreateQuizDto
  ): Promise<any> {
    return await this.learningService.createQuiz(+moduleId, quizData);
  }

  @Get('modules/:moduleId/quiz')
  @ApiOperation({ summary: 'Obtenir tous les quiz d\'un module' })
  @ApiParam({ name: 'moduleId', type: String })
  async getModuleQuizzes(@Param('moduleId') moduleId: string): Promise<any[]> {
    return await this.learningService.getModuleQuizzes(+moduleId);
  }

  @Get('quiz/:quizId')
  @ApiOperation({ summary: 'Obtenir un quiz spécifique avec ses questions' })
  @ApiParam({ name: 'quizId', type: String })
  async getQuizById(@Param('quizId') quizId: string, @Request() req): Promise<any> {
    const userId = req.user?.users_id;
    return await this.learningService.getQuizById(+quizId, userId);
  }

  @Post('quiz/:quizId/submit')
  @ApiOperation({ summary: 'Soumettre les réponses d\'un utilisateur à un quiz' })
  @ApiParam({ name: 'quizId', type: String })
  async submitQuizResponse(
    @Request() req,
    @Param('quizId') quizId: string,
    @Body() responseData: SubmitQuizResponseDto
  ): Promise<any> {
    const userId = req.user?.users_id;
    if (!userId) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }
    return await this.learningService.submitQuizResponse(userId, +quizId, responseData);
  }

  @Get('quiz/:quizId/results')
  @ApiOperation({ summary: 'Obtenir les résultats d\'un quiz pour l\'utilisateur courant' })
  @ApiParam({ name: 'quizId', type: String })
  async getQuizResults(
    @Request() req,
    @Param('quizId') quizId: string
  ): Promise<any> {
    const userId = req.user?.users_id;
    if (!userId) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }
    return await this.learningService.getQuizResults(userId, +quizId);
  }

  @Delete('quiz/:quizId')
  @ApiOperation({ summary: 'Supprimer un quiz' })
  @ApiParam({ name: 'quizId', type: String })
  @Roles('superadmin')
  async deleteQuiz(@Param('quizId') quizId: string): Promise<{ message: string }> {
    await this.learningService.deleteQuiz(+quizId);
    return { message: 'Quiz supprimé avec succès' };
  }

  // ==================== ROUTES POUR LES QUIZ FINAUX DE PARCOURS ====================

  @Post('parcours/:parcoursId/quiz-final')
  @ApiOperation({ summary: 'Créer un quiz final pour un parcours' })
  @ApiParam({ name: 'parcoursId', type: String })
  @ApiResponse({ status: 201, description: 'Quiz final créé' })
  @Roles('superadmin')
  async createParcoursFinalQuiz(
    @Param('parcoursId') parcoursId: string,
    @Body() quizData: CreateQuizDto
  ): Promise<any> {
    return await this.learningService.createParcoursFinalQuiz(+parcoursId, quizData);
  }

  @Get('parcours/:parcoursId/quiz-finaux')
  @ApiOperation({ summary: 'Obtenir tous les quiz finaux d\'un parcours' })
  @ApiParam({ name: 'parcoursId', type: String })
  async getParcoursFinalQuizzes(@Param('parcoursId') parcoursId: string): Promise<any[]> {
    return await this.learningService.getParcoursFinalQuizzes(+parcoursId);
  }

}

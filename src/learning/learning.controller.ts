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
import { Quiz } from './entities/quiz.entity';
import { Question } from './entities/question.entity';
import { Reponse } from './entities/reponse.entity';
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

  @Put('parcours/:id')
  @ApiOperation({ summary: 'Mettre à jour un parcours' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Parcours mis à jour', type: LearningPath })
  @Roles('superadmin')
  async updateLearningPath(@Param('id') id: string, @Body() updateData: Partial<LearningPath>): Promise<LearningPath> {
    return await this.learningService.updateLearningPath(+id, updateData);
  }

  @Delete('parcours/:id')
  @ApiOperation({ summary: 'Supprimer un parcours (cascade automatique)' })
  @ApiParam({ name: 'id', type: String })
  @Roles('superadmin')
  async deleteLearningPath(@Param('id') id: string): Promise<{ message: string }> {
    await this.learningService.deleteLearningPath(+id);
    return { message: 'Parcours supprimé avec succès (toutes les relations supprimées automatiquement)' };
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
    return { message: 'Module supprimé avec succès (toutes les relations supprimées automatiquement)' };
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
    const destDir = path.join(process.cwd(), `ressources/medias/${thematique}/${nomModule}`);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    const tempPath = path.join(process.cwd(), 'ressources/temp', file.filename);
    const finalPath = path.join(destDir, file.filename);

    try {
      fs.renameSync(tempPath, finalPath);
      
      // Créer l'objet complet pour le service
      const { module_id, ...mediaDataWithoutModuleId } = mediaData as any;
      const cheminStockage = `ressources/medias/${thematique}/${nomModule}/${file.filename}`;
      const completeMediaData: CreateMediaContentDto = {
        ...mediaDataWithoutModuleId,
        module_id: moduleId, // Utiliser le moduleId extrait par ParseIntPipe
        chemin_stockage: cheminStockage,
        nom_fichier: file.originalname,
        taille_fichier: file.size,
        url_fichier: '', // Sera construite automatiquement par le service
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
    const destDir = path.join(process.cwd(), `ressources/medias/${thematique}/${nomModule}`);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    const tempPath = path.join(process.cwd(), 'ressources/temp', file.filename);
    const finalPath = path.join(destDir, file.filename);

    try {
      fs.renameSync(tempPath, finalPath);
      
      // Créer l'objet complet pour le service
      const { module_id, ...mediaDataWithoutModuleId } = mediaData as any;
      const cheminStockage = `ressources/medias/${thematique}/${nomModule}/${file.filename}`;
      const completeMediaData: CreateMediaContentDto = {
        ...mediaDataWithoutModuleId,
        module_id: moduleId, // Utiliser le moduleId extrait par ParseIntPipe
        chemin_stockage: cheminStockage,
        nom_fichier: file.originalname,
        taille_fichier: file.size,
        url_fichier: '', // Sera construite automatiquement par le service
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
  @ApiOperation({ summary: 'Lister les médias d\'un module' })
  @ApiParam({ name: 'moduleId', type: String })
  async getMediaContentByModule(@Param('moduleId') moduleId: string): Promise<MediaContent[]> {
    return await this.learningService.getMediaContentByModule(+moduleId);
  }

  @Get('media')
  @ApiOperation({ summary: 'Lister tous les contenus médias' })
  async getAllMediaContent(): Promise<MediaContent[]> {
    return await this.learningService.getAllMediaContent();
  }

  @Get('media/:mediaId')
  @ApiOperation({ summary: 'Récupérer un contenu média par ID' })
  @ApiParam({ name: 'mediaId', type: String })
  @ApiResponse({ status: 200, description: 'Contenu média récupéré avec succès', type: MediaContent })
  @ApiResponse({ status: 404, description: 'Contenu média non trouvé' })
  async getMediaContentById(@Param('mediaId') mediaId: string): Promise<MediaContent> {
    return await this.learningService.getMediaContentById(+mediaId);
  }

  @Get('media/:mediaId/stream')
  @ApiOperation({ summary: 'Streamer un média (supporte HTTP Range)' })
  @ApiParam({ name: 'mediaId', type: String })
  async streamMediaContent(@Param('mediaId') mediaId: string, @Request() req, @Response() res) {
    try {
      const media = await this.learningService.getMediaContentById(+mediaId);
      if (!media) {
        throw new BadRequestException('Media not found');
      }

      // Vérifier si c'est un fichier local ou une URL externe
      if (media.url_fichier && !media.chemin_stockage) {
        // Rediriger vers l'URL externe
        return res.redirect(media.url_fichier);
      }

      if (!media.chemin_stockage) {
        throw new BadRequestException('No file path available for this media');
      }

      const filePath = path.join(process.cwd(), media.chemin_stockage);
      
      if (!fs.existsSync(filePath)) {
        throw new BadRequestException('File not found on server');
      }

      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      const range = req.headers.range;

      // Déterminer le type MIME basé sur l'extension du fichier
      const ext = path.extname(media.nom_fichier || filePath).toLowerCase();
      const mimeTypes = {
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.ogg': 'video/ogg',
        '.avi': 'video/x-msvideo',
        '.mov': 'video/quicktime',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.pdf': 'application/pdf',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.txt': 'text/plain',
        '.html': 'text/html'
      };
      const contentType = mimeTypes[ext] || 'application/octet-stream';

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
          'Content-Type': contentType,
        };
        res.writeHead(206, head);
        file.pipe(res);
      } else {
        const head = {
          'Content-Length': fileSize,
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes',
        };
        res.writeHead(200, head);
        fs.createReadStream(filePath).pipe(res);
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Error streaming media: ${error.message}`);
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

  @Get('organisations-parcours')
  @ApiOperation({ summary: 'Lister toutes les associations organisation-parcours' })
  async getAllOrganisationLearningPaths(): Promise<OrganisationLearningPath[]> {
    return await this.learningService.getAllOrganisationLearningPaths();
  }

  @Get('organisations-parcours/:id')
  @ApiOperation({ summary: 'Récupérer une association organisation-parcours par ID' })
  @ApiParam({ name: 'id', type: String })
  async getOrganisationLearningPathById(@Param('id') id: string): Promise<OrganisationLearningPath> {
    return await this.learningService.getOrganisationLearningPathById(+id);
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

  @Post('quizzes/:type/parent/:parentId')
  @ApiOperation({ summary: 'Créer un quiz en précisant le type et le parent' })
  @ApiParam({ name: 'type', type: String, description: 'Type de quiz: module | parcours_final' })
  @ApiParam({ name: 'parentId', type: String, description: 'ID du parent: module_id si type=module, parcours_id si type=parcours_final' })
  @ApiResponse({ status: 201, description: 'Quiz créé' })
  @Roles('superadmin')
  async createQuizUnified(
    @Param('type') type: string,
    @Param('parentId') parentId: string,
    @Body() quizData: CreateQuizDto
  ): Promise<any> {
    if (type === 'module') {
      return await this.learningService.createQuiz(+parentId, quizData);
    }
    if (type === 'parcours_final') {
      return await this.learningService.createParcoursFinalQuiz(+parentId, quizData);
    }
    throw new BadRequestException('Type de quiz invalide. Utilisez "module" ou "parcours_final".');
  }

  @Get('quizzes/:type/parent/:parentId')
  @ApiOperation({ summary: 'Obtenir les quiz selon le type et le parent' })
  @ApiParam({ name: 'type', type: String, description: 'Type de quiz: module | parcours_final' })
  @ApiParam({ name: 'parentId', type: String, description: 'ID du parent: module_id si type=module, parcours_id si type=parcours_final' })
  async getQuizzesByTypeAndParent(
    @Param('type') type: string,
    @Param('parentId') parentId: string
  ): Promise<any[]> {
    if (type === 'module') {
      return await this.learningService.getModuleQuizzes(+parentId);
    }
    if (type === 'parcours_final') {
      return await this.learningService.getParcoursFinalQuizzes(+parentId);
    }
    throw new BadRequestException('Type de quiz invalide. Utilisez "module" ou "parcours_final".');
  }

  @Get('quiz/:quizId')
  @ApiOperation({ summary: 'Obtenir un quiz spécifique avec ses questions (pour répondre - sans réponses correctes)' })
  @ApiParam({ name: 'quizId', type: String })
  async getQuizById(@Param('quizId') quizId: string, @Request() req): Promise<any> {
    const userId = req.user?.users_id;
    return await this.learningService.getQuizById(+quizId, userId);
  }

  @Get('quiz/:quizId/admin')
  @ApiOperation({ summary: 'Obtenir un quiz avec toutes les informations (pour administration - avec réponses correctes)' })
  @ApiParam({ name: 'quizId', type: String })
  @Roles('superadmin', 'admin')
  async getQuizByIdWithAnswers(@Param('quizId') quizId: string, @Request() req): Promise<any> {
    const userId = req.user?.users_id;
    return await this.learningService.getQuizByIdWithAnswers(+quizId, userId);
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

  @Put('quiz/:quizId')
  @ApiOperation({ summary: 'Mettre à jour un quiz' })
  @ApiParam({ name: 'quizId', type: String })
  @ApiResponse({ status: 200, description: 'Quiz mis à jour' })
  @Roles('superadmin')
  async updateQuiz(@Param('quizId') quizId: string, @Body() updateData: Partial<Quiz>): Promise<Quiz> {
    return await this.learningService.updateQuiz(+quizId, updateData);
  }

  @Delete('quiz/:quizId')
  @ApiOperation({ summary: 'Supprimer un quiz (cascade automatique)' })
  @ApiParam({ name: 'quizId', type: String })
  @Roles('superadmin')
  async deleteQuiz(@Param('quizId') quizId: string): Promise<{ message: string }> {
    await this.learningService.deleteQuiz(+quizId);
    return { message: 'Quiz supprimé avec succès (toutes les relations supprimées automatiquement)' };
  }

  // ===== QUESTIONS =====

  @Post('questions')
  @ApiOperation({ summary: 'Créer une question' })
  @ApiResponse({ status: 201, description: 'Question créée' })
  @Roles('superadmin')
  async createQuestion(@Body() questionData: Partial<Question>): Promise<Question> {
    return await this.learningService.createQuestion(questionData);
  }

  @Get('questions')
  @ApiOperation({ summary: 'Lister toutes les questions' })
  @ApiResponse({ status: 200, description: 'Liste des questions' })
  async getAllQuestions(): Promise<Question[]> {
    return await this.learningService.getAllQuestions();
  }

  @Get('questions/:id')
  @ApiOperation({ summary: 'Détail d\'une question' })
  @ApiParam({ name: 'id', type: String })
  async getQuestionById(@Param('id') id: string): Promise<Question> {
    return await this.learningService.getQuestionById(+id);
  }

  @Put('questions/:id')
  @ApiOperation({ summary: 'Mettre à jour une question' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Question mise à jour' })
  @Roles('superadmin')
  async updateQuestion(@Param('id') id: string, @Body() updateData: Partial<Question>): Promise<Question> {
    return await this.learningService.updateQuestion(+id, updateData);
  }

  @Delete('questions/:id')
  @ApiOperation({ summary: 'Supprimer une question (cascade automatique)' })
  @ApiParam({ name: 'id', type: String })
  @Roles('superadmin')
  async deleteQuestion(@Param('id') id: string): Promise<{ message: string }> {
    await this.learningService.deleteQuestion(+id);
    return { message: 'Question supprimée avec succès (toutes les relations supprimées automatiquement)' };
  }

  // ===== RÉPONSES =====

  @Post('reponses')
  @ApiOperation({ summary: 'Créer une réponse' })
  @ApiResponse({ status: 201, description: 'Réponse créée' })
  @Roles('superadmin')
  async createReponse(@Body() reponseData: Partial<Reponse>): Promise<Reponse> {
    return await this.learningService.createReponse(reponseData);
  }

  @Get('reponses')
  @ApiOperation({ summary: 'Lister toutes les réponses' })
  @ApiResponse({ status: 200, description: 'Liste des réponses' })
  async getAllReponses(): Promise<Reponse[]> {
    return await this.learningService.getAllReponses();
  }

  @Get('reponses/:id')
  @ApiOperation({ summary: 'Détail d\'une réponse' })
  @ApiParam({ name: 'id', type: String })
  async getReponseById(@Param('id') id: string): Promise<Reponse> {
    return await this.learningService.getReponseById(+id);
  }

  @Put('reponses/:id')
  @ApiOperation({ summary: 'Mettre à jour une réponse' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Réponse mise à jour' })
  @Roles('superadmin')
  async updateReponse(@Param('id') id: string, @Body() updateData: Partial<Reponse>): Promise<Reponse> {
    return await this.learningService.updateReponse(+id, updateData);
  }

  @Delete('reponses/:id')
  @ApiOperation({ summary: 'Supprimer une réponse' })
  @ApiParam({ name: 'id', type: String })
  @Roles('superadmin')
  async deleteReponse(@Param('id') id: string): Promise<{ message: string }> {
    await this.learningService.deleteReponse(+id);
    return { message: 'Réponse supprimée avec succès' };
  }

}

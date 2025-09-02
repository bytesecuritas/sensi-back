import {
  Controller,
  Get,
  Post,
  Param,
  Request,
  UseGuards,
  ParseIntPipe,
  BadRequestException,
  ForbiddenException,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CertificateService } from './certificate.service';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('Certificats')
@ApiBearerAuth('bearer')
@Controller('certificates')
@UseGuards(JwtAuthGuard)
export class CertificateController {
  constructor(private readonly certificateService: CertificateService) {}

  @Get('eligibility/:parcoursId')
  @ApiOperation({ summary: 'Vérifier l\'éligibilité à une certification' })
  @ApiParam({ name: 'parcoursId', type: String })
  @ApiResponse({ status: 200, description: 'Éligibilité vérifiée' })
  async checkEligibility(
    @Request() req,
    @Param('parcoursId', ParseIntPipe) parcoursId: number,
  ) {
    const userId = req.user?.users_id;
    if (!userId) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }

    return await this.certificateService.checkCertificationEligibility(userId, parcoursId);
  }

  @Post('generate/:parcoursId')
  @ApiOperation({ summary: 'Générer une certification pour un parcours' })
  @ApiParam({ name: 'parcoursId', type: String })
  @ApiResponse({ status: 201, description: 'Certification générée' })
  async generateCertification(
    @Request() req,
    @Param('parcoursId', ParseIntPipe) parcoursId: number,
  ) {
    const userId = req.user?.users_id;
    if (!userId) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }

    try {
      const certification = await this.certificateService.generateCertification(userId, parcoursId);
      return {
        message: 'Certification générée avec succès',
        certification: {
          id: certification.certification_id,
          numero: certification.numero_certification,
          score: certification.score_final,
          date_emission: certification.date_emission,
          url: certification.url_certification,
        },
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('user')
  @ApiOperation({ summary: 'Récupérer toutes les certifications de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Liste des certifications' })
  async getUserCertifications(@Request() req) {
    const userId = req.user?.users_id;
    if (!userId) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }

    const certifications = await this.certificateService.getUserCertifications(userId);
    return {
      certifications: certifications.map(cert => ({
        id: cert.certification_id,
        numero: cert.numero_certification,
        parcours: cert.parcours.titre,
        score: cert.score_final,
        date_emission: cert.date_emission,
        date_expiration: cert.date_expiration,
        statut: cert.statut,
        badges_obtenus: cert.badges_obtenus,
        niveau_atteint: cert.niveau_atteint,
      })),
    };
  }

  @Get(':certificationId')
  @ApiOperation({ summary: 'Récupérer une certification spécifique' })
  @ApiParam({ name: 'certificationId', type: String })
  @ApiResponse({ status: 200, description: 'Certification trouvée' })
  async getCertification(
    @Request() req,
    @Param('certificationId', ParseIntPipe) certificationId: number,
  ) {
    const userId = req.user?.users_id;
    if (!userId) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }

    const certification = await this.certificateService.getCertificationById(certificationId);
    
    // Vérifier que l'utilisateur est propriétaire de la certification
    if (certification.utilisateur.users_id !== userId) {
      throw new ForbiddenException('Accès non autorisé à cette certification');
    }

    return {
      certification: {
        id: certification.certification_id,
        numero: certification.numero_certification,
        parcours: certification.parcours.titre,
        score: certification.score_final,
        modules_completes: certification.modules_completes,
        quiz_reussis: certification.quiz_reussis,
        simulations_reussies: certification.simulations_reussies,
        temps_total: certification.temps_total_formation,
        date_emission: certification.date_emission,
        date_expiration: certification.date_expiration,
        statut: certification.statut,
        points_totaux: certification.points_totaux_gagnes,
        badges_obtenus: certification.badges_obtenus,
        liste_badges: certification.liste_badges,
        niveau_atteint: certification.niveau_atteint,
        commentaires: certification.commentaires,
        url_certification: certification.url_certification,
      },
    };
  }

  @Get(':certificationId/download')
  @ApiOperation({ summary: 'Télécharger le certificat PDF' })
  @ApiParam({ name: 'certificationId', type: String })
  @ApiResponse({ status: 200, description: 'Fichier PDF du certificat' })
  async downloadCertificate(
    @Request() req,
    @Param('certificationId', ParseIntPipe) certificationId: number,
    @Res() res: Response,
  ) {
    const userId = req.user?.users_id;
    if (!userId) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }

    const certification = await this.certificateService.getCertificationById(certificationId);
    
    // Vérifier que l'utilisateur est propriétaire de la certification
    if (certification.utilisateur.users_id !== userId) {
      throw new ForbiddenException('Accès non autorisé à cette certification');
    }

    // Construire le chemin du fichier
    const filePath = path.join(process.cwd(), certification.url_certification);
    
    // Vérifier si le fichier existe
    if (!fs.existsSync(filePath)) {
      throw new BadRequestException('Fichier de certificat non trouvé');
    }

    // Envoyer le fichier
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificat_${certification.numero_certification}.pdf"`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  }

  @Get('stats/user')
  @ApiOperation({ summary: 'Statistiques des certifications de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Statistiques des certifications' })
  async getUserCertificationStats(@Request() req) {
    const userId = req.user?.users_id;
    if (!userId) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }

    const certifications = await this.certificateService.getUserCertifications(userId);
    
    const stats = {
      total_certifications: certifications.length,
      certifications_validees: certifications.filter(c => c.statut === 'validee').length,
      certifications_expirees: certifications.filter(c => c.statut === 'expiree').length,
      score_moyen: certifications.length > 0 
        ? certifications.reduce((sum, c) => sum + c.score_final, 0) / certifications.length 
        : 0,
      badges_totaux: certifications.reduce((sum, c) => sum + c.badges_obtenus, 0),
      points_totaux: certifications.reduce((sum, c) => sum + c.points_totaux_gagnes, 0),
      parcours_completes: [...new Set(certifications.map(c => c.parcours.parcours_id))].length,
    };

    return { stats };
  }
}

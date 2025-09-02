import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certification, CertificationStatus } from './entities/certification.entity';
import { User } from '../users/users.entity';
import { LearningPath } from './entities/learning-path.entity';
import { Progress, ProgressStatus } from './entities/progress.entity';
import { QuizResponse } from './entities/quiz-response.entity';
import { SimulationResponse, SimulationResponseStatus } from './entities/simulation-response.entity';
import { UserLevel } from './entities/user-level.entity';
import { UserBadge } from './entities/user-badge.entity';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CertificateService {
  private readonly logger = new Logger(CertificateService.name);

  constructor(
    @InjectRepository(Certification)
    private certificationRepository: Repository<Certification>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(LearningPath)
    private learningPathRepository: Repository<LearningPath>,
    @InjectRepository(Progress)
    private progressRepository: Repository<Progress>,
    @InjectRepository(QuizResponse)
    private quizResponseRepository: Repository<QuizResponse>,
    @InjectRepository(SimulationResponse)
    private simulationResponseRepository: Repository<SimulationResponse>,
    @InjectRepository(UserLevel)
    private userLevelRepository: Repository<UserLevel>,
    @InjectRepository(UserBadge)
    private userBadgeRepository: Repository<UserBadge>,
  ) {}

  /**
   * Vérifie si un utilisateur peut obtenir une certification pour un parcours
   */
  async checkCertificationEligibility(userId: number, parcoursId: number): Promise<{
    eligible: boolean;
    modulesCompletes: number;
    totalModules: number;
    scoreGlobal: number;
    details: any;
  }> {
    // Récupérer le parcours avec ses modules
    const parcours = await this.learningPathRepository.findOne({
      where: { parcours_id: parcoursId },
      relations: ['modules', 'modules.quiz'],
    });

    if (!parcours) {
      throw new Error('Parcours non trouvé');
    }

    // Récupérer la progression de l'utilisateur pour ce parcours
    const progression = await this.progressRepository.findOne({
      where: {
        utilisateur: { users_id: userId },
        parcours: { parcours_id: parcoursId },
      },
      relations: ['parcours'],
    });

    const totalModules = parcours.modules.length;
    const modulesCompletes = progression ? Math.round((progression.score / 100) * totalModules) : 0;
    
    // Calculer le score global basé sur la progression du parcours
    const scoreGlobal = progression ? progression.score : 0;

    // Vérifier l'éligibilité (tous les modules terminés avec un score minimum de 70%)
    const eligible = modulesCompletes === totalModules && scoreGlobal >= 70;

    // Récupérer les détails des quiz et simulations
    const details = await this.getCertificationDetails(userId, parcoursId);

    return {
      eligible,
      modulesCompletes,
      totalModules,
      scoreGlobal,
      details,
    };
  }

  /**
   * Génère une certification complète pour un utilisateur
   */
  async generateCertification(userId: number, parcoursId: number): Promise<Certification> {
    const eligibility = await this.checkCertificationEligibility(userId, parcoursId);
    
    if (!eligibility.eligible) {
      throw new Error('L\'utilisateur n\'est pas éligible pour cette certification');
    }

    // Récupérer les informations utilisateur et parcours
    const user = await this.userRepository.findOne({ where: { users_id: userId } });
    const parcours = await this.learningPathRepository.findOne({ where: { parcours_id: parcoursId } });

    if (!user || !parcours) {
      throw new Error('Utilisateur ou parcours non trouvé');
    }

    // Récupérer les métriques de gamification
    const userLevel = await this.userLevelRepository.findOne({
      where: { utilisateur: { users_id: userId } },
    });

    const userBadges = await this.userBadgeRepository.find({
      where: { utilisateur: { users_id: userId } },
      relations: ['badge'],
    });

    // Calculer les métriques finales
    const details = eligibility.details;
    const pointsTotaux = userLevel?.points_totaux || 0;
    const badgesObtenus = userBadges.length;
    const listeBadges = userBadges.map(ub => ub.badge.nom);
    const niveauAtteint = userLevel?.niveau_actuel || 'debutant';

    // Générer le numéro de certification unique
    const numeroCertification = this.generateCertificationNumber();

    // Créer la certification
    const certification = this.certificationRepository.create({
      utilisateur: user,
      parcours: parcours,
      type_certification: this.mapParcoursToCertificationType(parcours.public_cible) as any,
      date_emission: new Date(),
      statut: CertificationStatus.VALIDEE,
      score_final: eligibility.scoreGlobal,
      modules_completes: eligibility.modulesCompletes,
      quiz_reussis: details.quizReussis,
      simulations_reussies: details.simulationsReussies,
      temps_total_formation: details.tempsTotal,
      numero_certification: numeroCertification,
      date_expiration: this.calculateExpirationDate(),
      points_totaux_gagnes: pointsTotaux,
      badges_obtenus: badgesObtenus,
      liste_badges: listeBadges,
      niveau_atteint: niveauAtteint,
      commentaires: this.generateCommentaires(eligibility.scoreGlobal, details),
    });

    const savedCertification = await this.certificationRepository.save(certification);

    // Générer le PDF
    const pdfPath = await this.generateCertificatePDF(savedCertification);
    savedCertification.url_certification = pdfPath;
    
    return await this.certificationRepository.save(savedCertification);
  }

  /**
   * Génère le certificat PDF au format A4
   */
  private async generateCertificatePDF(certification: Certification): Promise<string> {
    // Créer le dossier de certificats s'il n'existe pas
    const certDir = path.join(process.cwd(), 'certificats');
    if (!fs.existsSync(certDir)) {
      fs.mkdirSync(certDir, { recursive: true });
    }

    const filename = `certificat_${certification.numero_certification}.pdf`;
    const filepath = path.join(certDir, filename);

    // Utiliser une bibliothèque PDF (comme PDFKit ou Puppeteer)
    // Pour cet exemple, je vais créer un template HTML qui peut être converti en PDF
    const htmlContent = this.generateCertificateHTML(certification);
    
    // Sauvegarder le HTML (en production, utiliser une vraie conversion PDF)
    fs.writeFileSync(filepath.replace('.pdf', '.html'), htmlContent);

    return `certificats/${filename}`;
  }

  /**
   * Génère le contenu HTML du certificat
   */
  private generateCertificateHTML(certification: Certification): string {
    const user = certification.utilisateur;
    const parcours = certification.parcours;
    const dateEmission = new Date(certification.date_emission).toLocaleDateString('fr-FR');
    const dateExpiration = certification.date_expiration 
      ? new Date(certification.date_expiration).toLocaleDateString('fr-FR')
      : 'Illimitée';

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificat de Formation - ${parcours.titre}</title>
    <style>
        @page {
            size: A4;
            margin: 2cm;
        }
        body {
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            margin: 0;
            padding: 20px;
        }
        .certificate-container {
            background: white;
            border: 3px solid #2c3e50;
            border-radius: 15px;
            padding: 40px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            position: relative;
            min-height: 800px;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #3498db;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
        }
        .title {
            font-size: 28px;
            font-weight: bold;
            color: #2c3e50;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .subtitle {
            font-size: 16px;
            color: #7f8c8d;
            margin-top: 5px;
        }
        .main-content {
            text-align: center;
            margin: 40px 0;
        }
        .certificate-text {
            font-size: 18px;
            line-height: 2;
            margin: 30px 0;
        }
        .recipient-name {
            font-size: 24px;
            font-weight: bold;
            color: #2c3e50;
            text-transform: uppercase;
            margin: 20px 0;
            padding: 15px;
            border: 2px solid #3498db;
            border-radius: 10px;
            background: linear-gradient(135deg, #ecf0f1 0%, #bdc3c7 100%);
        }
        .course-info {
            font-size: 20px;
            font-weight: bold;
            color: #e74c3c;
            margin: 20px 0;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin: 30px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
        }
        .stat-item {
            text-align: center;
            padding: 15px;
            background: white;
            border-radius: 8px;
            border: 1px solid #dee2e6;
        }
        .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #3498db;
        }
        .stat-label {
            font-size: 12px;
            color: #6c757d;
            text-transform: uppercase;
        }
        .footer {
            margin-top: 40px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
        }
        .signature-section {
            text-align: center;
            padding: 20px;
            border-top: 1px solid #dee2e6;
        }
        .signature-line {
            width: 200px;
            height: 1px;
            background: #2c3e50;
            margin: 10px auto;
        }
        .certificate-number {
            position: absolute;
            top: 20px;
            right: 20px;
            font-size: 12px;
            color: #6c757d;
        }
        .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 120px;
            color: rgba(52, 152, 219, 0.1);
            z-index: -1;
            font-weight: bold;
        }
        .badges-section {
            margin: 20px 0;
            padding: 15px;
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
        }
        .badge-list {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            justify-content: center;
        }
        .badge-item {
            background: #3498db;
            color: white;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="certificate-container">
        <div class="watermark">CERTIFIÉ</div>
        <div class="certificate-number">N° ${certification.numero_certification}</div>
        
        <div class="header">
            <div class="logo">🛡️ CYBERSÉCURITÉ</div>
            <div class="title">Certificat de Formation</div>
            <div class="subtitle">Sensibilisation à la Cybersécurité</div>
        </div>

        <div class="main-content">
            <div class="certificate-text">
                Ce certificat est décerné à
            </div>
            
            <div class="recipient-name">
                ${user.prenom} ${user.nom}
            </div>
            
            <div class="certificate-text">
                pour avoir complété avec succès la formation
            </div>
            
            <div class="course-info">
                "${parcours.titre}"
            </div>
            
            <div class="certificate-text">
                avec un score final de <strong>${certification.score_final.toFixed(1)}%</strong>
            </div>
        </div>

        <div class="stats-grid">
            <div class="stat-item">
                <div class="stat-value">${certification.modules_completes}</div>
                <div class="stat-label">Modules Complétés</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${certification.quiz_reussis}</div>
                <div class="stat-label">Quiz Réussis</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${certification.simulations_reussies}</div>
                <div class="stat-label">Simulations Réussies</div>
            </div>
        </div>

        ${certification.badges_obtenus > 0 ? `
        <div class="badges-section">
            <h4>🏆 Badges Obtenus (${certification.badges_obtenus})</h4>
            <div class="badge-list">
                ${certification.liste_badges.map(badge => `<span class="badge-item">${badge}</span>`).join('')}
            </div>
        </div>
        ` : ''}

        <div class="footer">
            <div class="signature-section">
                <div class="signature-line"></div>
                <div>Date d'émission</div>
                <div><strong>${dateEmission}</strong></div>
            </div>
            <div class="signature-section">
                <div class="signature-line"></div>
                <div>Date d'expiration</div>
                <div><strong>${dateExpiration}</strong></div>
            </div>
        </div>

        <div style="margin-top: 30px; font-size: 12px; color: #6c757d; text-align: center;">
            <p>Ce certificat atteste que ${user.prenom} ${user.nom} a suivi avec succès la formation 
            "${parcours.titre}" et a démontré les compétences nécessaires en cybersécurité.</p>
            <p>Niveau de gamification atteint: <strong>${certification.niveau_atteint.toUpperCase()}</strong></p>
            <p>Points totaux gagnés: <strong>${certification.points_totaux_gagnes}</strong></p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Récupère les détails complets pour la certification
   */
  private async getCertificationDetails(userId: number, parcoursId: number): Promise<any> {
    // Récupérer les réponses aux quiz
    const quizResponses = await this.quizResponseRepository.find({
      where: {
        utilisateur: { users_id: userId },
        quiz: { module: { parcours: { parcours_id: parcoursId } } },
      },
      relations: ['quiz', 'quiz.module'],
    });

    // Récupérer les réponses aux simulations
    const simulationResponses = await this.simulationResponseRepository.find({
      where: {
        utilisateur: { users_id: userId },
      },
      relations: ['simulation'],
    });

    // Calculer les statistiques
    const quizReussis = quizResponses.filter(qr => qr.est_correcte).length;
    const simulationsReussies = simulationResponses.filter(sr => sr.statut === SimulationResponseStatus.REUSSIE).length;
    
    // Calculer le temps total
    const progression = await this.progressRepository.findOne({
      where: {
        utilisateur: { users_id: userId },
        parcours: { parcours_id: parcoursId },
      },
    });

    const tempsTotal = progression ? progression.temps_passe : 0;

    return {
      quizReussis,
      simulationsReussies,
      tempsTotal: Math.round(tempsTotal * 100) / 100,
      totalQuiz: quizResponses.length,
      totalSimulations: simulationResponses.length,
    };
  }

  /**
   * Génère un numéro de certification unique
   */
  private generateCertificationNumber(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `CERT-${timestamp.toUpperCase()}-${random.toUpperCase()}`;
  }

  /**
   * Calcule la date d'expiration (2 ans par défaut)
   */
  private calculateExpirationDate(): Date {
    const expiration = new Date();
    expiration.setFullYear(expiration.getFullYear() + 2);
    return expiration;
  }

  /**
   * Mappe le type de parcours vers le type de certification
   */
  private mapParcoursToCertificationType(publicCible: string): string {
    const mapping = {
      'entreprise': 'VIGILANCE_NUMERIQUE',
      'gouvernement': 'EXPERT_CYBERSECURITE',
      'education': 'SENSIBILISATION_BASIQUE',
      'enfants': 'SECURITE_ENFANTS',
      'adolescents': 'SENSIBILISATION_BASIQUE',
      'grand_public': 'SENSIBILISATION_BASIQUE',
    };
    return mapping[publicCible] || 'SENSIBILISATION_BASIQUE';
  }

  /**
   * Génère des commentaires personnalisés
   */
  private generateCommentaires(score: number, details: any): string {
    if (score >= 90) {
      return `Excellente performance ! L'utilisateur a démontré une maîtrise exceptionnelle des concepts de cybersécurité.`;
    } else if (score >= 80) {
      return `Très bonne performance. L'utilisateur a bien assimilé les concepts de cybersécurité.`;
    } else if (score >= 70) {
      return `Bonne performance. L'utilisateur a atteint le niveau requis en cybersécurité.`;
    } else {
      return `Performance satisfaisante. L'utilisateur a validé les compétences de base en cybersécurité.`;
    }
  }

  /**
   * Récupère une certification par ID
   */
  async getCertificationById(certificationId: number): Promise<Certification> {
    const certification = await this.certificationRepository.findOne({
      where: { certification_id: certificationId },
      relations: ['utilisateur', 'parcours'],
    });

    if (!certification) {
      throw new Error('Certification non trouvée');
    }

    return certification;
  }

  /**
   * Récupère toutes les certifications d'un utilisateur
   */
  async getUserCertifications(userId: number): Promise<Certification[]> {
    return await this.certificationRepository.find({
      where: { utilisateur: { users_id: userId } },
      relations: ['parcours'],
      order: { date_emission: 'DESC' },
    });
  }
}

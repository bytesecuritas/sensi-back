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
// Puppeteer est utilisé pour générer un PDF paysage A4 depuis le HTML
// En cas d'absence de la dépendance, un fallback enregistre le HTML à la place
let puppeteer: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  puppeteer = require('puppeteer');
} catch (e) {
  puppeteer = null;
}
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
      relations: ['modules', 'modules.quiz', 'modules.quiz.questions'],
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
    // Calcul précis des modules complétés: un module est complété si tous ses quiz de type module sont validés à 100%
    let modulesCompletes = 0;
    if (totalModules > 0) {
      // Récupérer toutes les réponses de l'utilisateur pour les quiz de module de ce parcours
      const responsesForParcoursModules = await this.quizResponseRepository.find({
        where: {
          utilisateur: { users_id: userId },
          quiz: { module: { parcours: { parcours_id: parcoursId } }, type_quiz: 'module' as any },
        },
        relations: ['quiz', 'quiz.questions', 'quiz.module'],
      });

      for (const module of parcours.modules) {
        // Obtenir les quiz associés à ce module depuis la relation chargée
        const moduleQuizzes = module.quiz || [];
        if (moduleQuizzes.length === 0) {
          continue;
        }

        let moduleReussi = true;
        for (const q of moduleQuizzes) {
          const reps = responsesForParcoursModules.filter(r => r.quiz?.quiz_id === q.quiz_id);
          if (reps.length === 0) { moduleReussi = false; break; }
          const totalObtained = reps.reduce((sum, r) => sum + Number(r.points_obtenus || 0), 0);
          const totalPoints = (q.questions || []).reduce((sum, quest) => sum + Number(quest.points || 0), 0);
          const pct = totalPoints > 0 ? (totalObtained / totalPoints) * 100 : 0;
          if (pct < 100) { moduleReussi = false; break; }
        }
        if (moduleReussi) modulesCompletes++;
      }
    }
    
    // Vérifier la réussite du(des) quiz finaux du parcours
    const finalQuizResponses = await this.quizResponseRepository.find({
      where: {
        utilisateur: { users_id: userId },
        quiz: { parcours: { parcours_id: parcoursId }, type_quiz: 'parcours_final' as any },
      },
      relations: ['quiz', 'quiz.questions'],
    });

    // Grouper par quiz et calculer le meilleur score obtenu sur un quiz final
    const quizIdToResponses = new Map<number, typeof finalQuizResponses>();
    for (const resp of finalQuizResponses) {
      const qid = resp.quiz?.quiz_id;
      if (!qid) continue;
      const list = quizIdToResponses.get(qid) || ([] as any);
      list.push(resp);
      quizIdToResponses.set(qid, list);
    }

    let bestFinalQuizScorePct = 0;
    let hasValidatedFinalQuiz = false;
    for (const [qid, reps] of quizIdToResponses.entries()) {
      const quiz = reps[0]?.quiz;
      const totalObtained = reps.reduce((sum, r) => sum + Number(r.points_obtenus || 0), 0);
      const totalPoints = (quiz?.questions || []).reduce((sum, q) => sum + Number(q.points || 0), 0);
      const pct = totalPoints > 0 ? (totalObtained / totalPoints) * 100 : 0;
      bestFinalQuizScorePct = Math.max(bestFinalQuizScorePct, pct);
      const threshold = Number(quiz?.score_minimum_pour_reussite ?? 80);
      if (pct >= threshold) {
        hasValidatedFinalQuiz = true;
      }
    }

    // Le score global pour la certification correspond au meilleur score au quiz final
    const scoreGlobal = bestFinalQuizScorePct;

    // Éligible si au moins un quiz final est validé
    const eligible = hasValidatedFinalQuiz;

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
    // Empêcher les doublons: un utilisateur ne peut pas avoir plus d'une certification pour le même parcours
    const existing = await this.certificationRepository.findOne({
      where: {
        utilisateur: { users_id: userId },
        parcours: { parcours_id: parcoursId },
      },
      relations: ['utilisateur', 'parcours'],
    });
    if (existing) {
      throw new Error('Une certification existe déjà pour ce parcours. Supprimez-la avant d\'en générer une nouvelle.');
    }

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
   * Génère le certificat PDF au format A4 paysage et le stocke sous ressources/certicats
   */
  private async generateCertificatePDF(certification: Certification): Promise<string> {
    // Créer le dossier de certificats s'il n'existe pas: ressources/certicats
    const certDir = path.join(process.cwd(), 'ressources', 'certicats');
    if (!fs.existsSync(certDir)) {
      fs.mkdirSync(certDir, { recursive: true });
    }

    const filename = `certificat_${certification.numero_certification}.pdf`;
    const filepath = path.join(certDir, filename);

    const htmlContent = this.generateCertificateHTML(certification);

    // Si puppeteer est disponible, on génère un vrai PDF en paysage
    if (puppeteer) {
      const browser = await puppeteer.launch({
        headless: 'new',
        // Ces flags améliorent la compatibilité dans certains environnements CI/Windows
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      try {
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        await page.pdf({
          path: filepath,
          format: 'A4',
          landscape: true,
          printBackground: true,
          preferCSSPageSize: true,
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
        });
      } finally {
        await browser.close();
      }
    } else {
      // Fallback: enregistrer le HTML pour inspection si Puppeteer n'est pas installé
      fs.writeFileSync(filepath.replace('.pdf', '.html'), htmlContent);
    }

    // Retourner un chemin relatif exploitable par le contrôleur
    return path.join('ressources', 'certicats', filename).replace(/\\/g, '/');
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
        @page { size: A4 landscape; margin: 0; }
        html, body {
            width: 297mm;
            height: 210mm;
            margin: 0;
            padding: 0;
            page-break-after: avoid;
            page-break-before: avoid;
            page-break-inside: avoid;
        }
        body {
            font-family: 'Times New Roman', serif;
            line-height: 1.4;
            color: #333;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            margin: 0;
            padding: 0;
        }
        .certificate-container {
            background: white;
            border: 3px solid #2c3e50;
            border-radius: 15px;
            padding: 12mm 12mm;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            position: relative;
            width: 297mm; /* ensure fits inside A4 landscape after padding/border */
            height: 210mm;
            box-sizing: border-box;
            page-break-inside: avoid;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #3498db;
            padding-bottom: 12px;
            margin-bottom: 18px;
        }
        .logo {
            font-size: 18px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
        }
        .title {
            font-size: 22px;
            font-weight: bold;
            color: #2c3e50;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .subtitle {
            font-size: 14px;
            color: #7f8c8d;
            margin-top: 5px;
        }
        .main-content {
            text-align: center;
            margin: 24px 0;
        }
        .certificate-text {
            font-size: 16px;
            line-height: 1.8;
            margin: 16px 0;
        }
        .recipient-name {
            font-size: 18px;
            font-weight: bold;
            color: #2c3e50;
            text-transform: uppercase;
            margin: 12px 0;
            padding: 10px;
            border: 2px solid #3498db;
            border-radius: 10px;
            background: linear-gradient(135deg, #ecf0f1 0%, #bdc3c7 100%);
        }
        .course-info {
            font-size: 16px;
            font-weight: bold;
            color: #e74c3c;
            margin: 12px 0;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin: 18px 0;
            padding: 14px;
            background: #f8f9fa;
            border-radius: 10px;
        }
        .stat-item {
            text-align: center;
            padding: 10px;
            background: white;
            border-radius: 8px;
            border: 1px solid #dee2e6;
        }
        .stat-value {
            font-size: 18px;
            font-weight: bold;
            color: #3498db;
        }
        .stat-label {
            font-size: 12px;
            color: #6c757d;
            text-transform: uppercase;
        }
        .footer {
            margin-top: 14px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 18px;
        }
        .signature-section {
            text-align: center;
            padding: 12px;
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
            font-size: 80px;
            color: rgba(52, 152, 219, 0.1);
            z-index: -1;
            font-weight: bold;
        }
        .badges-section {
            margin: 12px 0;
            padding: 12px;
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
        }
        .badge-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            justify-content: center;
        }
        .badge-item {
            background: #3498db;
            color: white;
            padding: 4px 8px;
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
                avec un score final de <strong>${Number(certification.score_final ?? 0).toFixed(1)}%</strong>
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
    // Récupérer les réponses aux quiz de module uniquement (pas les quiz finaux)
    const quizResponses = await this.quizResponseRepository.find({
      where: {
        utilisateur: { users_id: userId },
        quiz: { 
          module: { parcours: { parcours_id: parcoursId } },
          type_quiz: 'module' as any
        },
      },
      relations: ['quiz', 'quiz.module', 'quiz.questions'],
    });

    // Récupérer les réponses aux simulations
    const simulationResponses = await this.simulationResponseRepository.find({
      where: {
        utilisateur: { users_id: userId },
      },
      relations: ['simulation'],
    });

    // Récupérer aussi les réponses aux quiz finaux
    const finalQuizResponses = await this.quizResponseRepository.find({
      where: {
        utilisateur: { users_id: userId },
        quiz: { 
          parcours: { parcours_id: parcoursId },
          type_quiz: 'parcours_final' as any
        },
      },
      relations: ['quiz', 'quiz.questions', 'quiz.parcours'],
    });

    // Calculer les statistiques - compter les quiz réussis (100% pour modules, 80% pour finaux)
    let quizReussis = 0;
    
    // Compter les quiz de module (100% requis)
    const moduleQuizIds = [...new Set(quizResponses.map(qr => qr.quiz.quiz_id))];
    for (const quizId of moduleQuizIds) {
      const responsesForQuiz = quizResponses.filter(qr => qr.quiz.quiz_id === quizId);
      if (responsesForQuiz.length > 0) {
        const totalObtained = responsesForQuiz.reduce((sum, r) => sum + Number(r.points_obtenus || 0), 0);
        const totalPoints = responsesForQuiz[0].quiz.questions ? 
          responsesForQuiz[0].quiz.questions.reduce((sum, q) => sum + Number(q.points || 0), 0) : 0;
        const percentage = totalPoints > 0 ? (totalObtained / totalPoints) * 100 : 0;
        
        if (percentage >= 100) {
          quizReussis++;
        }
      }
    }
    
    // Compter les quiz finaux (80% requis)
    const finalQuizIds = [...new Set(finalQuizResponses.map(qr => qr.quiz.quiz_id))];
    for (const quizId of finalQuizIds) {
      const responsesForQuiz = finalQuizResponses.filter(qr => qr.quiz.quiz_id === quizId);
      if (responsesForQuiz.length > 0) {
        const totalObtained = responsesForQuiz.reduce((sum, r) => sum + Number(r.points_obtenus || 0), 0);
        const totalPoints = responsesForQuiz[0].quiz.questions ? 
          responsesForQuiz[0].quiz.questions.reduce((sum, q) => sum + Number(q.points || 0), 0) : 0;
        const percentage = totalPoints > 0 ? (totalObtained / totalPoints) * 100 : 0;
        const threshold = Number(responsesForQuiz[0].quiz.score_minimum_pour_reussite ?? 80);
        
        if (percentage >= threshold) {
          quizReussis++;
        }
      }
    }

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
      totalQuiz: moduleQuizIds.length + finalQuizIds.length,
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
    if (score >= 95) {
      return `Excellente performance ! L'utilisateur a démontré une maîtrise exceptionnelle des concepts de cybersécurité.`;
    } else if (score >= 90) {
      return `Très bonne performance. L'utilisateur a bien assimilé les concepts de cybersécurité.`;
    } else if (score >= 85) {
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
   * Supprime une certification et son fichier PDF associé
   */
  async deleteCertificationAndFile(userId: number, certificationId: number): Promise<boolean> {
    const certification = await this.certificationRepository.findOne({
      where: { certification_id: certificationId },
      relations: ['utilisateur'],
    });

    if (!certification) {
      throw new Error('Certification non trouvée');
    }
    if (certification.utilisateur.users_id !== userId) {
      throw new Error('Accès non autorisé à cette certification');
    }

    // Supprimer le fichier PDF si présent
    if (certification.url_certification) {
      try {
        const absPath = path.join(process.cwd(), certification.url_certification);
        if (fs.existsSync(absPath)) {
          fs.unlinkSync(absPath);
        }
        const htmlFallback = absPath.replace(/\.pdf$/i, '.html');
        if (fs.existsSync(htmlFallback)) {
          fs.unlinkSync(htmlFallback);
        }
      } catch (e) {
        this.logger.warn(`Impossible de supprimer le fichier du certificat: ${e.message}`);
      }
    }

    await this.certificationRepository.remove(certification);
    return true;
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

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/users.entity';
import { Simulation, SimulationType, SimulationStatus } from './entities/simulation.entity';
import { SimulationResponse, SimulationResponseStatus } from './entities/simulation-response.entity';
import { GamificationService } from './gamification.service';
import { CreateSimulationDto, SimulationResponseDto, SimulationResultDto } from './dto/simulation.dto';

@Injectable()
export class SimulationService {
  constructor(
    @InjectRepository(Simulation)
    private simulationRepository: Repository<Simulation>,
    @InjectRepository(SimulationResponse)
    private simulationResponseRepository: Repository<SimulationResponse>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private gamificationService: GamificationService,
  ) {}

  /**
   * Crée une nouvelle simulation
   */
  async createSimulation(createSimulationDto: CreateSimulationDto): Promise<Simulation> {
    const simulation = new Simulation();
    Object.assign(simulation, createSimulationDto);
    simulation.statut = SimulationStatus.ACTIVE;
    simulation.taux_reussite = 0;
    simulation.nombre_participants = 0;

    return await this.simulationRepository.save(simulation);
  }

  /**
   * Obtient toutes les simulations actives
   */
  async getActiveSimulations(): Promise<Simulation[]> {
    return await this.simulationRepository.find({
      where: { statut: SimulationStatus.ACTIVE },
      order: { date_creation: 'DESC' },
    });
  }

  /**
   * Obtient une simulation par ID
   */
  async getSimulationById(simulationId: number): Promise<Simulation> {
    const simulation = await this.simulationRepository.findOne({
      where: { simulation_id: simulationId },
    });

    if (!simulation) {
      throw new NotFoundException('Simulation non trouvée');
    }

    return simulation;
  }

  /**
   * Envoie une simulation à un utilisateur
   */
  async sendSimulationToUser(userId: number, simulationId: number): Promise<void> {
    const [user, simulation] = await Promise.all([
      this.userRepository.findOne({ where: { users_id: userId } }),
      this.getSimulationById(simulationId),
    ]);

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Vérifier si l'utilisateur a déjà reçu cette simulation
    const existingResponse = await this.simulationResponseRepository.findOne({
      where: {
        utilisateur: { users_id: userId },
        simulation: { simulation_id: simulationId },
      },
    });

    if (existingResponse) {
      throw new BadRequestException('Simulation déjà envoyée à cet utilisateur');
    }

    // Créer une nouvelle réponse de simulation
    const simulationResponse = new SimulationResponse();
    simulationResponse.utilisateur = user;
    simulationResponse.simulation = simulation;
    simulationResponse.statut = SimulationResponseStatus.EN_ATTENTE;
    simulationResponse.date_reception = new Date();

    await this.simulationResponseRepository.save(simulationResponse);

    // Mettre à jour les statistiques de la simulation
    simulation.nombre_participants += 1;
    await this.simulationRepository.save(simulation);
  }

  /**
   * Traite la réponse d'un utilisateur à une simulation
   */
  async processSimulationResponse(
    userId: number,
    simulationResponseDto: SimulationResponseDto,
  ): Promise<SimulationResultDto> {
    const [user, simulation] = await Promise.all([
      this.userRepository.findOne({ where: { users_id: userId } }),
      this.getSimulationById(simulationResponseDto.simulation_id),
    ]);

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Trouver la réponse existante
    const existingResponse = await this.simulationResponseRepository.findOne({
      where: {
        utilisateur: { users_id: userId },
        simulation: { simulation_id: simulationResponseDto.simulation_id },
      },
    });

    if (!existingResponse) {
      throw new NotFoundException('Simulation non trouvée pour cet utilisateur');
    }

    if (existingResponse.statut !== SimulationResponseStatus.EN_ATTENTE) {
      throw new BadRequestException('Simulation déjà traitée');
    }

    // Analyser la réponse
    const analysis = this.analyzeSimulationResponse(simulation, simulationResponseDto);
    const isSuccess = analysis.isCorrect;
    const pointsGagnes = isSuccess ? simulation.points_reussite : simulation.points_echec;

    // Mettre à jour la réponse
    existingResponse.statut = isSuccess ? SimulationResponseStatus.REUSSIE : SimulationResponseStatus.ECHOUEE;
    existingResponse.reponse_utilisateur = simulationResponseDto.reponse_utilisateur;
    existingResponse.date_reponse = new Date();
    existingResponse.points_gagnes = pointsGagnes;
    existingResponse.feedback_donne = analysis.feedback;
    existingResponse.details_reponse = simulationResponseDto.details_reponse || {};

    // Calculer le temps de réponse
    const tempsReponse = Math.floor(
      (existingResponse.date_reponse.getTime() - existingResponse.date_reception.getTime()) / 1000,
    );
    existingResponse.temps_reponse = tempsReponse;

    await this.simulationResponseRepository.save(existingResponse);

    // Attribuer les points via le service de gamification
    if (isSuccess) {
      await this.gamificationService.awardPoints(
        userId,
        pointsGagnes,
        `Simulation réussie: ${simulation.titre}`,
      );
    }

    // Mettre à jour les statistiques de la simulation
    await this.updateSimulationStats(simulation.simulation_id);

    // Obtenir les badges débloqués
    const badgesDebloques = isSuccess ? await this.checkSimulationBadges(userId, simulation) : [];

    // Obtenir la comparaison avec l'équipe
    const comparaisonEquipe = await this.getTeamComparison(userId, simulation.simulation_id, tempsReponse);

    return {
      statut: existingResponse.statut,
      points_gagnes: pointsGagnes,
      feedback: analysis.feedback,
      temps_reponse: tempsReponse,
      badges_debloques: badgesDebloques,
      comparaison_equipe: comparaisonEquipe,
    };
  }

  /**
   * Analyse la réponse d'un utilisateur à une simulation
   */
  private analyzeSimulationResponse(simulation: Simulation, response: SimulationResponseDto): {
    isCorrect: boolean;
    feedback: string;
  } {
    // Logique d'analyse selon le type de simulation
    switch (simulation.type) {
      case SimulationType.PHISHING_EMAIL:
        return this.analyzePhishingResponse(simulation, response);
      
      case SimulationType.VISHING:
        return this.analyzeVishingResponse(simulation, response);
      
      case SimulationType.SMISHING:
        return this.analyzeSmishingResponse(simulation, response);
      
      case SimulationType.RANSOMWARE:
        return this.analyzeRansomwareResponse(simulation, response);
      
      case SimulationType.SOCIAL_ENGINEERING:
        return this.analyzeSocialEngineeringResponse(simulation, response);
      
      default:
        return {
          isCorrect: false,
          feedback: 'Type de simulation non reconnu',
        };
    }
  }

  /**
   * Analyse une réponse de simulation de phishing
   */
  private analyzePhishingResponse(simulation: Simulation, response: SimulationResponseDto): {
    isCorrect: boolean;
    feedback: string;
  } {
    const reponse = response.reponse_utilisateur.toLowerCase();
    
    // Réponses correctes pour un email de phishing
    const correctResponses = [
      'marquer comme spam',
      'supprimer',
      'ignorer',
      'signaler',
      'ne pas cliquer',
      'suspect',
      'phishing',
    ];

    const isCorrect = correctResponses.some(correct => reponse.includes(correct));

    if (isCorrect) {
      return {
        isCorrect: true,
        feedback: simulation.feedback_succes || 'Excellent ! Vous avez correctement identifié un email de phishing.',
      };
    } else {
      return {
        isCorrect: false,
        feedback: simulation.feedback_echec || 'Attention ! Cet email présentait des signes de phishing.',
      };
    }
  }

  /**
   * Analyse une réponse de simulation de vishing
   */
  private analyzeVishingResponse(simulation: Simulation, response: SimulationResponseDto): {
    isCorrect: boolean;
    feedback: string;
  } {
    const reponse = response.reponse_utilisateur.toLowerCase();
    
    const correctResponses = [
      'raccrocher',
      'ne pas donner d\'informations',
      'vérifier l\'identité',
      'appeler directement',
      'suspect',
      'arnaque',
    ];

    const isCorrect = correctResponses.some(correct => reponse.includes(correct));

    return {
      isCorrect,
      feedback: isCorrect
        ? simulation.feedback_succes || 'Parfait ! Vous avez bien réagi face à un appel suspect.'
        : simulation.feedback_echec || 'Méfiez-vous des appels demandant des informations sensibles.',
    };
  }

  /**
   * Analyse une réponse de simulation de smishing
   */
  private analyzeSmishingResponse(simulation: Simulation, response: SimulationResponseDto): {
    isCorrect: boolean;
    feedback: string;
  } {
    const reponse = response.reponse_utilisateur.toLowerCase();
    
    const correctResponses = [
      'supprimer',
      'ignorer',
      'ne pas cliquer',
      'suspect',
      'arnaque',
      'phishing',
    ];

    const isCorrect = correctResponses.some(correct => reponse.includes(correct));

    return {
      isCorrect,
      feedback: isCorrect
        ? simulation.feedback_succes || 'Très bien ! Vous avez identifié un SMS suspect.'
        : simulation.feedback_echec || 'Les SMS peuvent aussi contenir des liens malveillants.',
    };
  }

  /**
   * Analyse une réponse de simulation de ransomware
   */
  private analyzeRansomwareResponse(simulation: Simulation, response: SimulationResponseDto): {
    isCorrect: boolean;
    feedback: string;
  } {
    const reponse = response.reponse_utilisateur.toLowerCase();
    
    const correctResponses = [
      'ne pas payer',
      'signaler',
      'isoler',
      'sauvegarde',
      'support it',
      'ne pas cliquer',
    ];

    const isCorrect = correctResponses.some(correct => reponse.includes(correct));

    return {
      isCorrect,
      feedback: isCorrect
        ? simulation.feedback_succes || 'Excellente réaction ! Ne jamais payer une rançon.'
        : simulation.feedback_echec || 'En cas de ransomware, contactez immédiatement votre service IT.',
    };
  }

  /**
   * Analyse une réponse de simulation de social engineering
   */
  private analyzeSocialEngineeringResponse(simulation: Simulation, response: SimulationResponseDto): {
    isCorrect: boolean;
    feedback: string;
  } {
    const reponse = response.reponse_utilisateur.toLowerCase();
    
    const correctResponses = [
      'vérifier',
      'ne pas faire confiance',
      'signaler',
      'suspect',
      'arnaque',
      'manipulation',
    ];

    const isCorrect = correctResponses.some(correct => reponse.includes(correct));

    return {
      isCorrect,
      feedback: isCorrect
        ? simulation.feedback_succes || 'Bravo ! Vous avez détecté une tentative de manipulation.'
        : simulation.feedback_echec || 'Méfiez-vous des demandes inhabituelles, même de personnes connues.',
    };
  }

  /**
   * Met à jour les statistiques d'une simulation
   */
  private async updateSimulationStats(simulationId: number): Promise<void> {
    const [totalResponses, successfulResponses] = await Promise.all([
      this.simulationResponseRepository.count({
        where: { simulation: { simulation_id: simulationId } },
      }),
      this.simulationResponseRepository.count({
        where: {
          simulation: { simulation_id: simulationId },
          statut: SimulationResponseStatus.REUSSIE,
        },
      }),
    ]);

    const tauxReussite = totalResponses > 0 ? (successfulResponses / totalResponses) * 100 : 0;

    await this.simulationRepository.update(simulationId, {
      nombre_participants: totalResponses,
      taux_reussite: tauxReussite,
    });
  }

  /**
   * Vérifie les badges débloqués par une simulation
   */
  private async checkSimulationBadges(userId: number, simulation: Simulation): Promise<any[]> {
    // Logique pour vérifier les badges spécifiques aux simulations
    const badges: any[] = [];
    
    // Badge "Vigilant" pour la première simulation réussie
    const simulationCount = await this.simulationResponseRepository.count({
      where: {
        utilisateur: { users_id: userId },
        statut: SimulationResponseStatus.REUSSIE,
      },
    });

    if (simulationCount === 1) {
      badges.push({
        nom: 'Vigilant',
        description: 'Première simulation réussie',
        type: 'bronze',
      } as any);
    }

    return badges;
  }

  /**
   * Obtient la comparaison avec l'équipe
   */
  private async getTeamComparison(userId: number, simulationId: number, tempsReponse: number): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { users_id: userId },
      relations: ['organisation'],
    });

    if (!user?.organisation) {
      return null;
    }

    // Obtenir tous les temps de réponse de l'équipe pour cette simulation
    const teamResponses = await this.simulationResponseRepository
      .createQueryBuilder('sr')
      .leftJoin('sr.utilisateur', 'u')
      .where('u.organisation.organisation_id = :orgId', { orgId: user.organisation.organisation_id })
      .andWhere('sr.simulation.simulation_id = :simId', { simId: simulationId })
      .andWhere('sr.statut = :status', { status: SimulationResponseStatus.REUSSIE })
      .orderBy('sr.temps_reponse', 'ASC')
      .getMany();

    const userPosition = teamResponses.findIndex(response => response.utilisateur.users_id === userId) + 1;
    const totalTeam = teamResponses.length;

    return {
      position: userPosition,
      total: totalTeam,
      temps_moyen: teamResponses.reduce((sum, r) => sum + r.temps_reponse, 0) / totalTeam,
      meilleur_temps: teamResponses[0]?.temps_reponse || 0,
    };
  }

  /**
   * Obtient l'historique des simulations d'un utilisateur
   */
  async getUserSimulationHistory(userId: number): Promise<SimulationResponse[]> {
    return await this.simulationResponseRepository.find({
      where: { utilisateur: { users_id: userId } },
      relations: ['simulation'],
      order: { date_creation: 'DESC' },
    });
  }

  /**
   * Obtient les statistiques globales des simulations
   */
  async getSimulationStats(): Promise<any> {
    const [totalSimulations, activeSimulations, totalResponses, successRate] = await Promise.all([
      this.simulationRepository.count(),
      this.simulationRepository.count({ where: { statut: SimulationStatus.ACTIVE } }),
      this.simulationResponseRepository.count(),
      this.simulationResponseRepository.count({ where: { statut: SimulationResponseStatus.REUSSIE } }),
    ]);

    return {
      total_simulations: totalSimulations,
      simulations_actives: activeSimulations,
      total_reponses: totalResponses,
      taux_reussite_global: totalResponses > 0 ? (successRate / totalResponses) * 100 : 0,
    };
  }
}

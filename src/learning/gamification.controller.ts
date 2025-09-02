import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GamificationService } from './gamification.service';
import { SimulationService } from './simulation.service';
import { ChatbotService } from './chatbot.service';
import { DashboardDto } from './dto/gamification.dto';
import { SimulationResponseDto, SimulationResultDto } from './dto/simulation.dto';
import { ChatbotMessageDto, ChatbotResponseDto, ConversationDto } from './dto/chatbot.dto';

@ApiTags('Gamification & User Experience')
@Controller('gamification')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GamificationController {
  constructor(
    private readonly gamificationService: GamificationService,
    private readonly simulationService: SimulationService,
    private readonly chatbotService: ChatbotService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Obtenir le tableau de bord personnalisé' })
  @ApiResponse({
    status: 200,
    description: 'Tableau de bord récupéré avec succès',
    type: DashboardDto,
  })
  async getDashboard(@Request() req): Promise<DashboardDto> {
    try {
      return await this.gamificationService.getDashboard(req.user.users_id);
    } catch (error) {
      throw new HttpException(
        'Erreur lors de la récupération du tableau de bord',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('daily-login')
  @ApiOperation({ summary: 'Enregistrer une connexion quotidienne' })
  @ApiResponse({
    status: 200,
    description: 'Connexion quotidienne enregistrée',
  })
  async recordDailyLogin(@Request() req): Promise<{ message: string }> {
    try {
      await this.gamificationService.updateDailyLogin(req.user.users_id);
      return { message: 'Connexion quotidienne enregistrée avec succès' };
    } catch (error) {
      throw new HttpException(
        'Erreur lors de l\'enregistrement de la connexion',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Simulations
  @Get('simulations')
  @ApiOperation({ summary: 'Obtenir les simulations actives' })
  @ApiResponse({
    status: 200,
    description: 'Liste des simulations actives',
  })
  async getActiveSimulations(@Request() req) {
    try {
      return await this.simulationService.getActiveSimulations();
    } catch (error) {
      throw new HttpException(
        'Erreur lors de la récupération des simulations',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('simulations/:id/send')
  @ApiOperation({ summary: 'Envoyer une simulation à l\'utilisateur' })
  @ApiResponse({
    status: 200,
    description: 'Simulation envoyée avec succès',
  })
  async sendSimulation(
    @Request() req,
    @Param('id') simulationId: number,
  ): Promise<{ message: string }> {
    try {
      await this.simulationService.sendSimulationToUser(req.user.users_id, simulationId);
      return { message: 'Simulation envoyée avec succès' };
    } catch (error) {
      throw new HttpException(
        'Erreur lors de l\'envoi de la simulation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('simulations/respond')
  @ApiOperation({ summary: 'Répondre à une simulation' })
  @ApiResponse({
    status: 200,
    description: 'Réponse traitée avec succès',
    type: SimulationResultDto,
  })
  async respondToSimulation(
    @Request() req,
    @Body() responseDto: SimulationResponseDto,
  ): Promise<SimulationResultDto> {
    try {
      return await this.simulationService.processSimulationResponse(req.user.users_id, responseDto);
    } catch (error) {
      throw new HttpException(
        'Erreur lors du traitement de la réponse',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('simulations/history')
  @ApiOperation({ summary: 'Obtenir l\'historique des simulations' })
  @ApiResponse({
    status: 200,
    description: 'Historique des simulations',
  })
  async getSimulationHistory(@Request() req) {
    try {
      return await this.simulationService.getUserSimulationHistory(req.user.users_id);
    } catch (error) {
      throw new HttpException(
        'Erreur lors de la récupération de l\'historique',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Chatbot
  @Post('chatbot/conversations')
  @ApiOperation({ summary: 'Créer une nouvelle conversation avec le chatbot' })
  @ApiResponse({
    status: 201,
    description: 'Conversation créée avec succès',
    type: ConversationDto,
  })
  async createConversation(
    @Request() req,
    @Body() body: { sujet?: string },
  ): Promise<ConversationDto> {
    try {
      return await this.chatbotService.createConversation(req.user.users_id, body.sujet);
    } catch (error) {
      throw new HttpException(
        'Erreur lors de la création de la conversation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('chatbot/conversations')
  @ApiOperation({ summary: 'Obtenir les conversations de l\'utilisateur' })
  @ApiResponse({
    status: 200,
    description: 'Liste des conversations',
    type: [ConversationDto],
  })
  async getUserConversations(@Request() req): Promise<ConversationDto[]> {
    try {
      return await this.chatbotService.getUserConversations(req.user.users_id);
    } catch (error) {
      throw new HttpException(
        'Erreur lors de la récupération des conversations',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('chatbot/conversations/:id/messages')
  @ApiOperation({ summary: 'Envoyer un message au chatbot' })
  @ApiResponse({
    status: 200,
    description: 'Message envoyé et réponse reçue',
    type: ChatbotResponseDto,
  })
  async sendMessage(
    @Request() req,
    @Param('id') conversationId: number,
    @Body() messageDto: ChatbotMessageDto,
  ): Promise<ChatbotResponseDto> {
    try {
      return await this.chatbotService.sendMessage(req.user.users_id, conversationId, messageDto);
    } catch (error) {
      throw new HttpException(
        'Erreur lors de l\'envoi du message',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('chatbot/conversations/:id/history')
  @ApiOperation({ summary: 'Obtenir l\'historique d\'une conversation' })
  @ApiResponse({
    status: 200,
    description: 'Historique de la conversation',
  })
  async getConversationHistory(@Param('id') conversationId: number) {
    try {
      return await this.chatbotService.getConversationHistory(conversationId);
    } catch (error) {
      throw new HttpException(
        'Erreur lors de la récupération de l\'historique',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('chatbot/conversations/:id/end')
  @ApiOperation({ summary: 'Terminer une conversation' })
  @ApiResponse({
    status: 200,
    description: 'Conversation terminée',
  })
  async endConversation(
    @Param('id') conversationId: number,
  ): Promise<{ message: string }> {
    try {
      await this.chatbotService.endConversation(conversationId);
      return { message: 'Conversation terminée avec succès' };
    } catch (error) {
      throw new HttpException(
        'Erreur lors de la terminaison de la conversation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('chatbot/conversations/:id/rate')
  @ApiOperation({ summary: 'Évaluer la satisfaction d\'une conversation' })
  @ApiResponse({
    status: 200,
    description: 'Évaluation enregistrée',
  })
  async rateConversation(
    @Param('id') conversationId: number,
    @Body() body: { satisfaction: number; feedback?: string },
  ): Promise<{ message: string }> {
    try {
      await this.chatbotService.rateConversation(conversationId, body.satisfaction, body.feedback);
      return { message: 'Évaluation enregistrée avec succès' };
    } catch (error) {
      throw new HttpException(
        'Erreur lors de l\'enregistrement de l\'évaluation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Statistiques et analytics
  @Get('stats/simulations')
  @ApiOperation({ summary: 'Obtenir les statistiques des simulations' })
  @ApiResponse({
    status: 200,
    description: 'Statistiques des simulations',
  })
  async getSimulationStats() {
    try {
      return await this.simulationService.getSimulationStats();
    } catch (error) {
      throw new HttpException(
        'Erreur lors de la récupération des statistiques',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stats/chatbot')
  @ApiOperation({ summary: 'Obtenir les statistiques du chatbot' })
  @ApiResponse({
    status: 200,
    description: 'Statistiques du chatbot',
  })
  async getChatbotStats() {
    try {
      return await this.chatbotService.getChatbotStats();
    } catch (error) {
      throw new HttpException(
        'Erreur lors de la récupération des statistiques',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stats/chatbot/intents')
  @ApiOperation({ summary: 'Obtenir les intentions les plus fréquentes' })
  @ApiResponse({
    status: 200,
    description: 'Intentions les plus fréquentes',
  })
  async getMostFrequentIntents() {
    try {
      return await this.chatbotService.getMostFrequentIntents();
    } catch (error) {
      throw new HttpException(
        'Erreur lors de la récupération des intentions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/users.entity';
import { ChatbotConversation, ConversationStatus } from './entities/chatbot-conversation.entity';
import { ChatbotMessage, MessageType, MessageStatus } from './entities/chatbot-message.entity';
import { ChatbotMessageDto, ChatbotResponseDto, ConversationDto, MessageDto } from './dto/chatbot.dto';

@Injectable()
export class ChatbotService {
  constructor(
    @InjectRepository(ChatbotConversation)
    private conversationRepository: Repository<ChatbotConversation>,
    @InjectRepository(ChatbotMessage)
    private messageRepository: Repository<ChatbotMessage>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // Base de connaissances du chatbot
  private readonly KNOWLEDGE_BASE = {
    phishing: {
      keywords: ['phishing', 'email', 'suspect', 'arnaque', 'spam', 'lien'],
      responses: [
        'Les emails de phishing présentent souvent des signes d\'urgence, des demandes d\'action immédiate, ou des expéditeurs inconnus.',
        'Pour identifier un email de phishing, vérifiez l\'adresse de l\'expéditeur, les liens suspects, et les demandes d\'informations sensibles.',
        'En cas de doute, ne cliquez jamais sur les liens et contactez directement l\'expéditeur par un autre moyen.',
      ],
    },
    password: {
      keywords: ['mot de passe', 'password', 'sécurisé', 'fort', 'complexe'],
      responses: [
        'Un mot de passe sécurisé doit contenir au moins 12 caractères, incluant majuscules, minuscules, chiffres et symboles.',
        'Évitez les mots de passe évidents comme "password123" ou des informations personnelles.',
        'Utilisez un gestionnaire de mots de passe pour générer et stocker des mots de passe uniques.',
        'Activez l\'authentification à deux facteurs quand c\'est possible.',
      ],
    },
    ransomware: {
      keywords: ['ransomware', 'rançon', 'cryptage', 'fichiers', 'paiement'],
      responses: [
        'En cas de ransomware, ne payez jamais la rançon. Contactez immédiatement votre service IT.',
        'Isolez l\'appareil infecté du réseau pour éviter la propagation.',
        'Ayez toujours des sauvegardes régulières et testées de vos données importantes.',
        'Maintenez vos logiciels à jour et utilisez un antivirus fiable.',
      ],
    },
    social_engineering: {
      keywords: ['manipulation', 'social engineering', 'confiance', 'urgence', 'autorité'],
      responses: [
        'Le social engineering exploite la confiance et l\'urgence pour obtenir des informations sensibles.',
        'Méfiez-vous des demandes inhabituelles, même de personnes que vous connaissez.',
        'Vérifiez toujours l\'identité de la personne avant de partager des informations sensibles.',
        'En cas de doute, demandez confirmation par un autre canal de communication.',
      ],
    },
    general: {
      keywords: ['aide', 'help', 'sécurité', 'cyber', 'protection'],
      responses: [
        'Je suis là pour vous aider avec vos questions de cybersécurité. Posez-moi vos questions !',
        'Les bonnes pratiques de cybersécurité incluent la vigilance, la formation continue et l\'utilisation d\'outils de protection.',
        'N\'hésitez pas à me poser des questions spécifiques sur le phishing, les mots de passe, ou d\'autres sujets.',
      ],
    },
  };

  /**
   * Crée une nouvelle conversation
   */
  async createConversation(userId: number, sujet?: string): Promise<ConversationDto> {
    const user = await this.userRepository.findOne({ where: { users_id: userId } });
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const conversation = new ChatbotConversation();
    conversation.utilisateur = user;
    conversation.statut = ConversationStatus.ACTIVE;
    conversation.sujet = sujet || null;
    conversation.nombre_messages = 0;
    conversation.derniere_activite = new Date();

    const savedConversation = await this.conversationRepository.save(conversation);

    return {
      conversation_id: savedConversation.conversation_id,
      statut: savedConversation.statut,
      sujet: savedConversation.sujet || undefined,
      nombre_messages: savedConversation.nombre_messages,
      derniere_activite: savedConversation.derniere_activite?.toISOString(),
    };
  }

  /**
   * Envoie un message et obtient une réponse du chatbot
   */
  async sendMessage(
    userId: number,
    conversationId: number,
    messageDto: ChatbotMessageDto,
  ): Promise<ChatbotResponseDto> {
    const startTime = Date.now();

    const [user, conversation] = await Promise.all([
      this.userRepository.findOne({ where: { users_id: userId } }),
      this.conversationRepository.findOne({ where: { conversation_id: conversationId } }),
    ]);

    if (!user || !conversation) {
      throw new NotFoundException('Utilisateur ou conversation non trouvé');
    }

    // Sauvegarder le message de l'utilisateur
    const userMessage = new ChatbotMessage();
    userMessage.conversation = conversation;
    userMessage.type = MessageType.UTILISATEUR;
    userMessage.contenu = messageDto.contenu;
    userMessage.metadata = messageDto.metadata || {};

    await this.messageRepository.save(userMessage);

    // Analyser le message et générer une réponse
    const analysis = this.analyzeMessage(messageDto.contenu);
    const response = this.generateResponse(analysis);

    // Sauvegarder la réponse du chatbot
    const botMessage = new ChatbotMessage();
    botMessage.conversation = conversation;
    botMessage.type = MessageType.BOT;
    botMessage.contenu = response.reponse;
    botMessage.intention_detectee = analysis.intention;
    botMessage.confiance_intention = analysis.confidence;
    botMessage.reponse_suggestions = response.suggestions;
    botMessage.temps_reponse_ms = Date.now() - startTime;

    await this.messageRepository.save(botMessage);

    // Mettre à jour la conversation
    conversation.nombre_messages += 2; // Message utilisateur + réponse bot
    conversation.derniere_activite = new Date();
    await this.conversationRepository.save(conversation);

    return {
      reponse: response.reponse,
      intention_detectee: analysis.intention,
      confiance_intention: analysis.confidence,
      suggestions: response.suggestions,
      ressources_liees: response.ressources,
      temps_reponse_ms: botMessage.temps_reponse_ms,
    };
  }

  /**
   * Obtient l'historique d'une conversation
   */
  async getConversationHistory(conversationId: number): Promise<MessageDto[]> {
    const messages = await this.messageRepository.find({
      where: { conversation: { conversation_id: conversationId } },
      order: { date_creation: 'ASC' },
    });

    return messages.map(message => ({
      message_id: message.message_id,
      type: message.type,
      contenu: message.contenu,
      statut: message.statut,
      intention_detectee: message.intention_detectee,
      confiance_intention: message.confiance_intention,
      date_creation: message.date_creation.toISOString(),
    }));
  }

  /**
   * Obtient les conversations d'un utilisateur
   */
  async getUserConversations(userId: number): Promise<ConversationDto[]> {
    const conversations = await this.conversationRepository.find({
      where: { utilisateur: { users_id: userId } },
      order: { derniere_activite: 'DESC' },
    });

    return conversations.map(conversation => ({
      conversation_id: conversation.conversation_id,
      statut: conversation.statut,
      sujet: conversation.sujet || undefined,
      nombre_messages: conversation.nombre_messages,
      derniere_activite: conversation.derniere_activite?.toISOString(),
    }));
  }

  /**
   * Termine une conversation
   */
  async endConversation(conversationId: number): Promise<void> {
    const conversation = await this.conversationRepository.findOne({
      where: { conversation_id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation non trouvée');
    }

    conversation.statut = ConversationStatus.TERMINEE;
    await this.conversationRepository.save(conversation);
  }

  /**
   * Évalue la satisfaction d'une conversation
   */
  async rateConversation(
    conversationId: number,
    satisfaction: number,
    feedback?: string,
  ): Promise<void> {
    const conversation = await this.conversationRepository.findOne({
      where: { conversation_id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation non trouvée');
    }

    conversation.satisfaction_utilisateur = satisfaction;
    conversation.feedback_utilisateur = feedback || null;
    conversation.est_resolue = satisfaction >= 3; // 3/5 ou plus = résolu

    await this.conversationRepository.save(conversation);
  }

  /**
   * Analyse un message pour détecter l'intention
   */
  private analyzeMessage(message: string): { intention: string; confidence: number } {
    const lowerMessage = message.toLowerCase();
    let bestMatch = { intention: 'general', confidence: 0.5 };

    for (const [category, data] of Object.entries(this.KNOWLEDGE_BASE)) {
      const keywordMatches = data.keywords.filter(keyword =>
        lowerMessage.includes(keyword.toLowerCase()),
      );

      if (keywordMatches.length > 0) {
        const confidence = Math.min(0.9, 0.5 + (keywordMatches.length * 0.1));
        if (confidence > bestMatch.confidence) {
          bestMatch = { intention: category, confidence };
        }
      }
    }

    return bestMatch;
  }

  /**
   * Génère une réponse basée sur l'analyse du message
   */
  private generateResponse(analysis: { intention: string; confidence: number }): {
    reponse: string;
    suggestions: string;
    ressources: any[];
  } {
    const category = this.KNOWLEDGE_BASE[analysis.intention] || this.KNOWLEDGE_BASE.general;
    const responses = category.responses;
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    // Générer des suggestions basées sur l'intention
    const suggestions = this.generateSuggestions(analysis.intention);

    // Générer des ressources liées
    const ressources = this.generateResources(analysis.intention);

    return {
      reponse: randomResponse,
      suggestions,
      ressources,
    };
  }

  /**
   * Génère des suggestions basées sur l'intention
   */
  private generateSuggestions(intention: string): string {
    const suggestions = {
      phishing: 'Voulez-vous en savoir plus sur la détection des emails de phishing ?',
      password: 'Souhaitez-vous des conseils pour créer des mots de passe plus sécurisés ?',
      ransomware: 'Voulez-vous des informations sur la prévention des rançongiciels ?',
      social_engineering: 'Souhaitez-vous des exemples de techniques de social engineering ?',
      general: 'Avez-vous des questions spécifiques sur la cybersécurité ?',
    };

    return suggestions[intention] || suggestions.general;
  }

  /**
   * Génère des ressources liées à l'intention
   */
  private generateResources(intention: string): any[] {
    const ressources = {
      phishing: [
        { type: 'module', titre: 'Reconnaître les Emails de Phishing', id: 1 },
        { type: 'quiz', titre: 'Testez vos Connaissances Phishing', id: 1 },
        { type: 'simulation', titre: 'Simulation Phishing Email', id: 1 },
      ],
      password: [
        { type: 'module', titre: 'Gestion des Mots de Passe Sécurisés', id: 2 },
        { type: 'guide', titre: 'Guide des Mots de Passe Forts', id: 1 },
      ],
      ransomware: [
        { type: 'module', titre: 'Protection contre les Rançongiciels', id: 3 },
        { type: 'alerte', titre: 'Alerte Ransomware Active', id: 1 },
      ],
      social_engineering: [
        { type: 'module', titre: 'Détection du Social Engineering', id: 4 },
        { type: 'etude_cas', titre: 'Étude de Cas: L\'Arnaque du Faux Support', id: 1 },
      ],
      general: [
        { type: 'module', titre: 'Fondamentaux de la Cybersécurité', id: 1 },
        { type: 'quiz', titre: 'Quiz Général Cybersécurité', id: 1 },
      ],
    };

    return ressources[intention] || ressources.general;
  }

  /**
   * Obtient les statistiques du chatbot
   */
  async getChatbotStats(): Promise<any> {
    const [totalConversations, activeConversations, totalMessages, avgSatisfaction] = await Promise.all([
      this.conversationRepository.count(),
      this.conversationRepository.count({ where: { statut: ConversationStatus.ACTIVE } }),
      this.messageRepository.count(),
      this.conversationRepository
        .createQueryBuilder('c')
        .select('AVG(c.satisfaction_utilisateur)', 'avg')
        .where('c.satisfaction_utilisateur IS NOT NULL')
        .getRawOne(),
    ]);

    return {
      total_conversations: totalConversations,
      conversations_actives: activeConversations,
      total_messages: totalMessages,
      satisfaction_moyenne: avgSatisfaction?.avg || 0,
    };
  }

  /**
   * Obtient les intentions les plus fréquentes
   */
  async getMostFrequentIntents(): Promise<any[]> {
    const intents = await this.messageRepository
      .createQueryBuilder('m')
      .select('m.intention_detectee', 'intention')
      .addSelect('COUNT(*)', 'count')
      .where('m.intention_detectee IS NOT NULL')
      .groupBy('m.intention_detectee')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany();

    return intents;
  }
}

import { IsString, IsNumber, IsEnum, IsOptional, IsBoolean, IsObject } from 'class-validator';
import { ConversationStatus } from '../entities/chatbot-conversation.entity';
import { MessageType, MessageStatus } from '../entities/chatbot-message.entity';

export class ChatbotMessageDto {
  @IsString()
  contenu: string;

  @IsOptional()
  @IsString()
  contexte?: string;

  @IsOptional()
  @IsObject()
  metadata?: object;
}

export class ChatbotResponseDto {
  @IsString()
  reponse: string;

  @IsOptional()
  @IsString()
  intention_detectee?: string;

  @IsOptional()
  @IsNumber()
  confiance_intention?: number;

  @IsOptional()
  @IsString()
  suggestions?: string;

  @IsOptional()
  @IsObject()
  ressources_liees?: object[];

  @IsNumber()
  temps_reponse_ms: number;
}

export class ConversationDto {
  @IsNumber()
  conversation_id: number;

  @IsEnum(ConversationStatus)
  statut: ConversationStatus;

  @IsOptional()
  @IsString()
  sujet?: string;

  @IsNumber()
  nombre_messages: number;

  @IsOptional()
  @IsString()
  derniere_activite?: string;
}

export class MessageDto {
  @IsNumber()
  message_id: number;

  @IsEnum(MessageType)
  type: MessageType;

  @IsString()
  contenu: string;

  @IsEnum(MessageStatus)
  statut: MessageStatus;

  @IsOptional()
  @IsString()
  intention_detectee?: string;

  @IsOptional()
  @IsNumber()
  confiance_intention?: number;

  @IsString()
  date_creation: string;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ChatbotConversation } from './chatbot-conversation.entity';

export enum MessageType {
  UTILISATEUR = 'utilisateur',
  BOT = 'bot',
  SYSTEME = 'systeme'
}

export enum MessageStatus {
  ENVOYE = 'envoye',
  LU = 'lu',
  TRAITE = 'traite'
}

@Entity('chatbot_messages')
export class ChatbotMessage {
  @PrimaryGeneratedColumn()
  message_id: number;

  @ManyToOne(() => ChatbotConversation, conversation => conversation.messages)
  @JoinColumn({ name: 'conversation_id' })
  conversation: ChatbotConversation;

  @Column({ type: 'enum', enum: MessageType })
  type: MessageType;

  @Column({ type: 'text' })
  contenu: string;

  @Column({ type: 'enum', enum: MessageStatus, default: MessageStatus.ENVOYE })
  statut: MessageStatus;

  @Column({ type: 'json', nullable: true })
  metadata: object;

  @Column({ type: 'varchar', length: 100, nullable: true })
  intention_detectee: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  confiance_intention: number;

  @Column({ type: 'text', nullable: true })
  reponse_suggestions: string;

  @Column({ type: 'boolean', default: false })
  est_utile: boolean;

  @Column({ type: 'integer', default: 0 })
  temps_reponse_ms: number;

  @CreateDateColumn({ type: 'timestamp' })
  date_creation: Date;
}

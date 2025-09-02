import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../users/users.entity';
import { ChatbotMessage } from './chatbot-message.entity';

export enum ConversationStatus {
  ACTIVE = 'active',
  TERMINEE = 'terminee',
  ARCHIVEE = 'archivee'
}

@Entity('chatbot_conversations')
export class ChatbotConversation {
  @PrimaryGeneratedColumn()
  conversation_id: number;

  @ManyToOne(() => User, user => user.chatbotConversations)
  @JoinColumn({ name: 'utilisateur_id' })
  utilisateur: User;

  @Column({ type: 'enum', enum: ConversationStatus, default: ConversationStatus.ACTIVE })
  statut: ConversationStatus;

  @Column({ type: 'varchar', length: 200, nullable: true })
  sujet: string | null;

  @Column({ type: 'text', nullable: true })
  contexte: string;

  @Column({ type: 'integer', default: 0 })
  nombre_messages: number;

  @Column({ type: 'timestamp', nullable: true })
  derniere_activite: Date;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  satisfaction_utilisateur: number;

  @Column({ type: 'text', nullable: true })
  feedback_utilisateur: string | null;

  @Column({ type: 'boolean', default: false })
  est_resolue: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  date_creation: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  date_maj: Date;

  // Relations
  @OneToMany(() => ChatbotMessage, message => message.conversation)
  messages: ChatbotMessage[];
}

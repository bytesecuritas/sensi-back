import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { Organisation } from '../organisations/organisations.entity';
import { Certification } from '../learning/entities/certification.entity';
import { Progress } from '../learning/entities/progress.entity';
import { QuizResponse } from '../learning/entities/quiz-response.entity';
import { UserBadge } from '../learning/entities/user-badge.entity';
import { UserLevel } from '../learning/entities/user-level.entity';
import { SimulationResponse } from '../learning/entities/simulation-response.entity';
import { ChallengeParticipation } from '../learning/entities/challenge-participation.entity';
import { AlertShare } from '../learning/entities/alert-share.entity';
import { ChatbotConversation } from '../learning/entities/chatbot-conversation.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  users_id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 200 })
  nom: string;

  @Column({ type: 'varchar', length: 100 })
  prenom: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'enum', enum: ['user', 'admin', 'superadmin'] })
  role: string;

  @ManyToOne(() => Organisation, organisation => organisation.utilisateurs, { nullable: true })
  @JoinColumn({ name: 'organisation_id' })
  organisation: Organisation;

  @Column({ type: 'integer' })
  age: number;

  @Column({ type: 'char', length: 2 })
  code_langue: string;

  @CreateDateColumn({ type: 'timestamp' })
  date_creation: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  date_maj: Date;

  // Relations avec les entités d'apprentissage
  @OneToMany(() => Certification, certification => certification.utilisateur, { onDelete: 'CASCADE' })
  certifications: Certification[];

  @OneToMany(() => Progress, progression => progression.utilisateur, { onDelete: 'CASCADE' })
  progressions: Progress[];

  @OneToMany(() => QuizResponse, reponse => reponse.utilisateur, { onDelete: 'CASCADE' })
  reponses_quiz: QuizResponse[];

  // Relations avec les nouvelles entités de gamification
  @OneToMany(() => UserBadge, userBadge => userBadge.utilisateur, { onDelete: 'CASCADE' })
  userBadges: UserBadge[];

  @OneToOne(() => UserLevel, userLevel => userLevel.utilisateur, { onDelete: 'CASCADE' })
  userLevel: UserLevel | null;

  @OneToMany(() => SimulationResponse, response => response.utilisateur, { onDelete: 'CASCADE' })
  simulationResponses: SimulationResponse[];

  @OneToMany(() => ChallengeParticipation, participation => participation.utilisateur, { onDelete: 'CASCADE' })
  challengeParticipations: ChallengeParticipation[];

  @OneToMany(() => AlertShare, share => share.utilisateur, { onDelete: 'CASCADE' })
  alertShares: AlertShare[];

  @OneToMany(() => ChatbotConversation, conversation => conversation.utilisateur, { onDelete: 'CASCADE' })
  chatbotConversations: ChatbotConversation[];
}
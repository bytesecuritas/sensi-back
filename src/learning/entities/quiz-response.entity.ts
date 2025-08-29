import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/users.entity';
import { Quiz } from './quiz.entity';
import { Question } from './question.entity';
import { Reponse } from './reponse.entity';

@Entity('reponse_quiz')
export class QuizResponse {
  @PrimaryGeneratedColumn()
  reponse_quiz_id: number;

  // Relation avec l'utilisateur
  @ManyToOne(() => User, user => user.reponses_quiz)
  @JoinColumn({ name: 'utilisateur_id' })
  utilisateur: User;

  // Relation avec le quiz
  @ManyToOne(() => Quiz, quiz => quiz.reponses_utilisateurs)
  @JoinColumn({ name: 'quiz_id' })
  quiz: Quiz;

  // Relation avec la question
  @ManyToOne(() => Question)
  @JoinColumn({ name: 'question_id' })
  question: Question;

  // Relation avec la réponse choisie (pour les questions à choix)
  @ManyToOne(() => Reponse, { nullable: true })
  @JoinColumn({ name: 'reponse_id' })
  reponse_choisie: Reponse;

  // Réponse texte libre (pour les questions de type texte)
  @Column({ type: 'text', nullable: true })
  reponse_texte: string;

  // Indique si la réponse est correcte
  @Column({ type: 'boolean', nullable: true })
  est_correcte: boolean;

  // Points obtenus pour cette question
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  points_obtenus: number;

  // Temps de réponse en secondes
  @Column({ type: 'int', default: 0 })
  temps_reponse_secondes: number;

  @CreateDateColumn({ type: 'timestamp' })
  date_reponse: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  date_maj: Date;
}

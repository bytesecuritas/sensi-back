import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { LearningPathModule } from './learning-module.entity';
import { Question } from './question.entity';
import { QuizResponse } from './quiz-response.entity';

@Entity('quiz')
export class Quiz {
  @PrimaryGeneratedColumn()
  quiz_id: number;

  @Column({ type: 'varchar', length: 255 })
  titre: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', default: 1 })
  ordre: number;

  @Column({ type: 'boolean', default: true })
  actif: boolean;

  @Column({ type: 'int', default: 0 })
  temps_limite_minutes: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 70.0 })
  score_minimum_pour_reussite: number;

  @CreateDateColumn({ type: 'timestamp' })
  date_creation: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  date_maj: Date;

  // Relation avec le module d'apprentissage
  @ManyToOne(() => LearningPathModule, module => module.quiz)
  @JoinColumn({ name: 'module_id' })
  module: LearningPathModule;

  // Relation avec les questions
  @OneToMany(() => Question, question => question.quiz, { cascade: true, onDelete: 'CASCADE' })
  questions: Question[];

  // Relation avec les réponses des utilisateurs
  @OneToMany(() => QuizResponse, reponse => reponse.quiz, { onDelete: 'CASCADE' })
  reponses_utilisateurs: QuizResponse[];
}

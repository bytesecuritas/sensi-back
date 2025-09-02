import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Quiz } from './quiz.entity';
import { Reponse } from './reponse.entity';

export enum TypeQuestion {
  CHOIX_UNIQUE = 'choix_unique',
  CHOIX_MULTIPLE = 'choix_multiple',
  VRAI_FAUX = 'vrai_faux',
  TEXTE_LIBRE = 'texte_libre'
}

@Entity('question')
export class Question {
  @PrimaryGeneratedColumn()
  question_id: number;

  @Column({ type: 'text' })
  enonce: string;

  @Column({ 
    type: 'enum', 
    enum: TypeQuestion,
    default: TypeQuestion.CHOIX_UNIQUE
  })
  type_question: TypeQuestion;

  @Column({ type: 'int', default: 1 })
  ordre: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 1.0 })
  points: number;

  @Column({ type: 'text', nullable: true })
  explication: string;

  @Column({ type: 'boolean', default: true })
  actif: boolean;

  // Termes acceptés pour les questions de type texte_libre (mise en correspondance souple)
  @Column('simple-array', { nullable: true })
  termes_acceptes: string[];

  @CreateDateColumn({ type: 'timestamp' })
  date_creation: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  date_maj: Date;

  // Relation avec le quiz
  @ManyToOne(() => Quiz, quiz => quiz.questions)
  @JoinColumn({ name: 'quiz_id' })
  quiz: Quiz;

  // Relation avec les réponses
  @OneToMany(() => Reponse, reponse => reponse.question, { cascade: true, onDelete: 'CASCADE' })
  reponses: Reponse[];
}

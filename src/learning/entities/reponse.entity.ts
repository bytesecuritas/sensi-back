import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Question } from './question.entity';

@Entity('reponse')
export class Reponse {
  @PrimaryGeneratedColumn()
  reponse_id: number;

  @Column({ type: 'text' })
  texte: string;

  @Column({ type: 'boolean', default: false })
  est_correcte: boolean;

  @Column({ type: 'int', default: 1 })
  ordre: number;

  @Column({ type: 'text', nullable: true })
  explication: string;

  @Column({ type: 'boolean', default: true })
  actif: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  date_creation: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  date_maj: Date;

  // Relation avec la question
  @ManyToOne(() => Question, question => question.reponses)
  @JoinColumn({ name: 'question_id' })
  question: Question;
}

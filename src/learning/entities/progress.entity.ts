import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/users.entity';
import { LearningPathModule } from './learning-module.entity';

export enum ProgressStatus {
  NON_COMMENCE = 'non_commence',
  EN_COURS = 'en_cours',
  TERMINE = 'termine',
  ABANDONNE = 'abandonne'
}

@Entity('progression')
export class Progress {
  @PrimaryGeneratedColumn()
  progression_id: number;

  // Relation avec l'utilisateur
  @ManyToOne(() => User, user => user.progressions)
  @JoinColumn({ name: 'utilisateur_id' })
  utilisateur: User;

  @Column({ type: 'bigint' })
  utilisateur_id: number;

  // Relation avec le module d'apprentissage
  @ManyToOne(() => LearningPathModule, module => module.progressions)
  @JoinColumn({ name: 'module_id' })
  module: LearningPathModule;

  @Column({ type: 'bigint' })
  module_id: number;

  @Column({ 
    type: 'enum', 
    enum: ProgressStatus,
    default: ProgressStatus.NON_COMMENCE
  })
  statut: ProgressStatus;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  score: number;

  @Column({ type: 'timestamp', nullable: true })
  date_completion: Date;

  @Column({ type: 'integer', default: 0 })
  temps_passe: number;

  @CreateDateColumn({ type: 'timestamp' })
  date_creation: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  date_maj: Date;
}

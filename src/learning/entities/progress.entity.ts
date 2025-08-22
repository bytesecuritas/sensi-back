import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, BeforeUpdate } from 'typeorm';
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

  // Relation avec le module d'apprentissage
  @ManyToOne(() => LearningPathModule, module => module.progressions)
  @JoinColumn({ name: 'module_id' })
  module: LearningPathModule;

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

  @BeforeUpdate()
  updateTempsPasseAndDateCompletion() {
    if (this.statut === ProgressStatus.TERMINE && !this.date_completion) {
      this.date_completion = new Date();
      
      // Utiliser date_creation au lieu de date_debut
      const debut = new Date(this.date_creation);
      const fin = new Date(this.date_completion);
      const diffMilliseconds = fin.getTime() - debut.getTime();
      const diffHeures = diffMilliseconds / (1000 * 60 * 60);
      this.temps_passe = Math.round(diffHeures * 100) / 100;
    }
  }
}


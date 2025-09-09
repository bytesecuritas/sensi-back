import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, BeforeUpdate } from 'typeorm';
import { User } from '../../users/users.entity';
import { LearningPath } from './learning-path.entity';

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

  // Relation avec le parcours d'apprentissage (au lieu du module)
  @ManyToOne(() => LearningPath, parcours => parcours.progressions)
  @JoinColumn({ name: 'parcours_id' })
  parcours: LearningPath;

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

  // ===== MÉTRIQUES DE GAMIFICATION =====
  @Column({ type: 'integer', default: 0 })
  points_gagnes: number; // Points gagnés pour ce parcours

  @Column({ type: 'boolean', default: false })
  badge_debloque: boolean; // Si le badge associé a été débloqué

  @Column({ type: 'varchar', length: 100, nullable: true })
  badge_obtenu: string; // Nom du badge obtenu

  @Column({ type: 'integer', default: 0 })
  quiz_score: number; // Score moyen des quiz (0-100)

  @Column({ type: 'boolean', default: false })
  quiz_reussi: boolean; // Si tous les quiz de module ont été réussis

  @Column({ type: 'integer', default: 0 })
  simulation_score: number; // Score de la simulation (0-100)

  @Column({ type: 'boolean', default: false })
  simulation_reussie: boolean; // Si la simulation a été réussie

  @Column({ type: 'integer', default: 0 })
  tentatives_quiz: number; // Nombre total de tentatives pour les quiz

  @Column({ type: 'integer', default: 0 })
  tentatives_simulation: number; // Nombre de tentatives pour la simulation

  @Column({ type: 'boolean', default: false })
  certificat_obtenu: boolean; // Si le certificat a été obtenu (quiz final réussi)

  @CreateDateColumn({ type: 'timestamp' })
  date_creation: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  date_maj: Date;

  @BeforeUpdate()
  updateTempsPasseAndDateCompletion() {
    if (this.statut === ProgressStatus.TERMINE && !this.date_completion) {
      this.date_completion = new Date();
    }
    
    // Calculer le temps passé à chaque mise à jour si pas déjà défini
    if (!this.temps_passe || this.temps_passe === 0) {
      const debut = new Date(this.date_creation);
      const fin = this.date_completion ? new Date(this.date_completion) : new Date();
      const diffMilliseconds = fin.getTime() - debut.getTime();
      const diffHeures = diffMilliseconds / (1000 * 60 * 60);
      this.temps_passe = Math.round(diffHeures * 100) / 100;
    }
  }
}


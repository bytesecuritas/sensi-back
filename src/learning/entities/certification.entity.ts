import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/users.entity';
import { LearningPath } from './learning-path.entity';

export enum CertificationType {
  SENSIBILISATION_BASIQUE = 'sensibilisation_basique',   // Niveau débutant
  VIGILANCE_NUMERIQUE = 'vigilance_numerique',           // Niveau intermédiaire
  EXPERT_CYBERSECURITE = 'expert_cybersecurite',         // Niveau avancé
  SPECIALISTE_ANTI_PHISHING = 'specialiste_anti_phishing', // Spécialisation phishing
  PROTECTION_DONNEES = 'protection_donnees',             // Spécialisation RGPD
  SECURITE_MOBILE = 'securite_mobile',                   // Spécialisation mobile
  SECURITE_ENFANTS = 'securite_enfants'                  // Spécialisation sécurité enfants
}

export enum CertificationStatus {
  EN_COURS = 'en_cours',
  VALIDEE = 'validee',
  EXPIREE = 'expiree',
  REVOQUEE = 'revoquee'
}

@Entity('certification')
export class Certification {
  @PrimaryGeneratedColumn()
  certification_id: number;

  // Relation avec l'utilisateur
  @ManyToOne(() => User, user => user.certifications)
  @JoinColumn({ name: 'utilisateur_id' })
  utilisateur: User;

  // Relation avec le parcours d'apprentissage
  @ManyToOne(() => LearningPath, parcours => parcours.certifications)
  @JoinColumn({ name: 'parcours_id' })
  parcours: LearningPath;

  @Column({ 
    type: 'enum', 
    enum: CertificationType,
    default: CertificationType.SENSIBILISATION_BASIQUE
  })
  type_certification: CertificationType;

  @Column({ type: 'timestamp' })
  date_emission: Date;

  @Column({ type: 'varchar', length: 255 })
  url_certification: string;

  // ===== PROPRIÉTÉS POUR GÉNÉRATION PDF =====
  @Column({ 
    type: 'enum', 
    enum: CertificationStatus,
    default: CertificationStatus.VALIDEE
  })
  statut: CertificationStatus;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  score_final: number; // Score global du parcours

  @Column({ type: 'integer', default: 0 })
  modules_completes: number; // Nombre de modules complétés

  @Column({ type: 'integer', default: 0 })
  quiz_reussis: number; // Nombre de quiz réussis

  @Column({ type: 'integer', default: 0 })
  simulations_reussies: number; // Nombre de simulations réussies

  @Column({ type: 'integer', default: 0 })
  temps_total_formation: number; // Temps total en heures

  @Column({ type: 'varchar', length: 255, nullable: true })
  numero_certification: string; // Numéro unique du certificat

  @Column({ type: 'timestamp', nullable: true })
  date_expiration: Date; // Date d'expiration du certificat

  @Column({ type: 'text', nullable: true })
  commentaires: string; // Commentaires sur la certification

  // ===== MÉTRIQUES DE GAMIFICATION =====
  @Column({ type: 'integer', default: 0 })
  points_totaux_gagnes: number; // Points totaux gagnés pendant la formation

  @Column({ type: 'integer', default: 0 })
  badges_obtenus: number; // Nombre de badges obtenus

  @Column('simple-array', { nullable: true })
  liste_badges: string[]; // Liste des badges obtenus

  @Column({ type: 'varchar', length: 50, nullable: true })
  niveau_atteint: string; // Niveau de gamification atteint
}

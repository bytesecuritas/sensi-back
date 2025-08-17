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

@Entity('certification')
export class Certification {
  @PrimaryGeneratedColumn()
  certification_id: number;

  // Relation avec l'utilisateur
  @ManyToOne(() => User, user => user.certifications)
  @JoinColumn({ name: 'utilisateur_id' })
  utilisateur: User;

  @Column({ type: 'bigint' })
  utilisateur_id: number;

  // Relation avec le parcours d'apprentissage
  @ManyToOne(() => LearningPath, parcours => parcours.certifications)
  @JoinColumn({ name: 'parcours_id' })
  parcours: LearningPath;

  @Column({ type: 'bigint' })
  parcours_id: number;

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
}

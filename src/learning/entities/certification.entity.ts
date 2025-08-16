import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/users.entity';
import { LearningPath } from './learning-path.entity';

export enum CertificationType {
  COMPLETION = 'completion',
  COMPETENCE = 'competence',
  MAITRISE = 'maitrise',
  SPECIALISATION = 'specialisation'
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
    default: CertificationType.COMPLETION
  })
  type_certification: CertificationType;

  @Column({ type: 'timestamp' })
  date_emission: Date;

  @Column({ type: 'varchar', length: 255 })
  url_certification: string;
}

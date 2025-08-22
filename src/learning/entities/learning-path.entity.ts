import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { LearningPathModule } from './learning-module.entity';
import { Certification } from './certification.entity';
import { OrganisationLearningPath } from './organisation-learning-path.entity';

export enum TargetAudience {
  ENTREPRISE = 'entreprise',           // Employés d'entreprise
  GOUVERNEMENT = 'gouvernement',       // Personnel gouvernemental
  EDUCATION = 'education',             // Personnel éducatif
  ENFANTS = 'enfants',                 // 7-12 ans
  ADOLESCENTS = 'adolescents',         // 13-17 ans
  GRAND_PUBLIC = 'grand_public'        // Tout public adulte
}

@Entity('parcours_apprentissage')
export class LearningPath {
  @PrimaryGeneratedColumn()
  parcours_id: number;

  @Column({ type: 'varchar', length: 255 })
  titre: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ 
    type: 'enum', 
    enum: TargetAudience,
    default: TargetAudience.ENTREPRISE
  })
  public_cible: TargetAudience;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  duree_estimee_heures: number;

  @CreateDateColumn({ type: 'timestamp' })
  date_creation: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  date_maj: Date;

  

  // Relation avec les modules d'apprentissage
  @OneToMany(() => LearningPathModule, module => module.parcours)
  modules: LearningPathModule[];

  // Relation avec les certifications
  @OneToMany(() => Certification, certification => certification.parcours)
  certifications: Certification[];

  // Relation many-to-many avec les organisations via la table de liaison
  @OneToMany(() => OrganisationLearningPath, orgPath => orgPath.parcours)
  organisationParcours: OrganisationLearningPath[];
}

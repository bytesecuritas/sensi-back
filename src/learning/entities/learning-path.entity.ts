import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { LearningModule } from './learning-module.entity';
import { Certification } from './certification.entity';
import { OrganisationLearningPath } from './organisation-learning-path.entity';

export enum TargetAudience {
  DEBUTANT = 'debutant',
  INTERMEDIAIRE = 'intermediaire',
  AVANCE = 'avance',
  TOUS = 'tous'
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
    default: TargetAudience.TOUS
  })
  public_cible: TargetAudience;

  @CreateDateColumn({ type: 'timestamp' })
  date_creation: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  date_maj: Date;

  // Relation avec les modules d'apprentissage
  @OneToMany(() => LearningModule, module => module.parcours)
  modules: LearningModule[];

  // Relation avec les certifications
  @OneToMany(() => Certification, certification => certification.parcours)
  certifications: Certification[];

  // Relation many-to-many avec les organisations via la table de liaison
  @OneToMany(() => OrganisationLearningPath, orgPath => orgPath.parcours)
  organisationParcours: OrganisationLearningPath[];
}

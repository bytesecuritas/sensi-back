import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organisation } from '../../organisations/organisations.entity';
import { LearningPath } from './learning-path.entity';

@Entity('organisation_parcours')
export class OrganisationLearningPath {
  @PrimaryGeneratedColumn()
  id: number;

  // Relation avec l'organisation
  @ManyToOne(() => Organisation, organisation => organisation.parcoursApprentissage)
  @JoinColumn({ name: 'organisation_id' })
  organisation: Organisation;

  // Relation avec le parcours d'apprentissage
  @ManyToOne(() => LearningPath, parcours => parcours.organisationParcours)
  @JoinColumn({ name: 'parcours_id' })
  parcours: LearningPath;

  // Date d'ajout du parcours à l'organisation (comme un panier)
  @CreateDateColumn({ type: 'timestamp' })
  date_ajout: Date;

  // Statut de l'association (actif, inactif, etc.)
  @Column({ type: 'boolean', default: true })
  actif: boolean;
}

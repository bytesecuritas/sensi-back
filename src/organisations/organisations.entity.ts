import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from '../users/users.entity';
import { OrganisationLearningPath } from '../learning/entities/organisation-learning-path.entity';

export enum OrganisationType {
  ENTREPRISE_PRIVEE = 'entreprise_privee',       // Entreprises du secteur privé
  ORGANISME_PUBLIC = 'organisme_public',         // Administrations, collectivités
  ETABLISSEMENT_SCOLAIRE = 'etablissement_scolaire', // Écoles, collèges, lycées
  ENSEIGNEMENT_SUPERIEUR = 'enseignement_superieur', // Universités, grandes écoles
  ASSOCIATION = 'association',                   // Associations et ONG
  CENTRE_FORMATION = 'centre_formation',          // Centres de formation professionnelle
  AUTRE = 'autre'                                // Autres organisations
}

@Entity('organisations')
export class Organisation {
  @PrimaryGeneratedColumn()
  organisation_id: number;

  @Column({ type: 'varchar', length: 255, unique:true })
  nom: string;

  @Column({  
    type: 'enum', 
    enum: OrganisationType,
    default: OrganisationType.AUTRE
  })
  type: OrganisationType;

  @Column({ type: 'varchar', length: 10 })
  code_pays: string;

  // La date de création de l'organisation 
  @Column({ type: 'date', nullable: true })
  date_creation: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telephone: string;

  @Column({ type: 'text', nullable: true })
  adresse: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  site_web: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  code_postal: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ville: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  pays: string;

  @CreateDateColumn({ type: 'timestamp' })
  date_ins: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  date_maj: Date;

  // Relation avec les utilisateurs
  @OneToMany(() => User, user => user.organisation, { onDelete: 'CASCADE' })
  utilisateurs: User[];

  // Relation many-to-many avec les parcours d'apprentissage via la table de liaison
  @OneToMany(() => OrganisationLearningPath, orgPath => orgPath.organisation, { onDelete: 'CASCADE' })
  parcoursApprentissage: OrganisationLearningPath[];
}

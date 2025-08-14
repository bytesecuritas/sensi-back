import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from '../users/users.entity';

export enum OrganisationType {
  ENTREPRISE = 'entreprise',
  ECOLE = 'ecole',
  ASSOCIATION = 'association',
  AUTRE = 'autre'
}

@Entity('organisations')
export class Organisation {
  @PrimaryGeneratedColumn()
  organisation_id: number;

  @Column({ type: 'varchar', length: 255 })
  nom: string;

  @Column({ 
    type: 'enum', 
    enum: OrganisationType,
    default: OrganisationType.AUTRE
  })
  type: OrganisationType;

  @Column({ type: 'varchar', length: 3 })
  code_pays: string;

  // La date de création de l'organisation 
  @Column({type: 'date'})
  date_creation: Date;

  @CreateDateColumn({ type: 'timestamp' })
  date_ins: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  date_maj: Date;

  // Relation avec les utilisateurs
  @OneToMany(() => User, user => user.organisation)
  utilisateurs: User[];
}

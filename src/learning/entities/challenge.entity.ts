import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../users/users.entity';
import { ChallengeParticipation } from './challenge-participation.entity';

export enum ChallengeType {
  HEBDOMADAIRE = 'hebdomadaire',
  MENSUEL = 'mensuel',
  QUOTIDIEN = 'quotidien',
  SPECIAL = 'special'
}

export enum ChallengeStatus {
  ACTIF = 'actif',
  TERMINE = 'termine',
  ANNULE = 'annule',
  PLANIFIE = 'planifie'
}

@Entity('challenges')
export class Challenge {
  @PrimaryGeneratedColumn()
  challenge_id: number;

  @Column({ type: 'varchar', length: 200 })
  titre: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: ChallengeType })
  type: ChallengeType;

  @Column({ type: 'enum', enum: ChallengeStatus, default: ChallengeStatus.ACTIF })
  statut: ChallengeStatus;

  @Column({ type: 'integer', default: 0 })
  points_recompense: number;

  @Column({ type: 'text', nullable: true })
  badge_recompense: string;

  @Column({ type: 'json' })
  objectifs: object;

  @Column({ type: 'integer', default: 0 })
  duree_jours: number;

  @Column({ type: 'timestamp' })
  date_debut: Date;

  @Column({ type: 'timestamp' })
  date_fin: Date;

  @Column({ type: 'integer', default: 0 })
  nombre_participants: number;

  @Column({ type: 'integer', default: 0 })
  nombre_reussites: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  taux_reussite: number;

  @Column({ type: 'boolean', default: false })
  est_obligatoire: boolean;

  @Column({ type: 'text', nullable: true })
  instructions: string;

  @Column({ type: 'json', nullable: true })
  criteres_evaluation: object;

  @CreateDateColumn({ type: 'timestamp' })
  date_creation: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  date_maj: Date;

  // Relations
  @OneToMany(() => ChallengeParticipation, participation => participation.challenge, { onDelete: 'CASCADE' })
  participations: ChallengeParticipation[];
}

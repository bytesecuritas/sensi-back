import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/users.entity';
import { Challenge } from './challenge.entity';

export enum ParticipationStatus {
  INSCRIT = 'inscrit',
  EN_COURS = 'en_cours',
  REUSSI = 'reussi',
  ECHOUE = 'echoue',
  ABANDONNE = 'abandonne'
}

@Entity('challenge_participations')
export class ChallengeParticipation {
  @PrimaryGeneratedColumn()
  participation_id: number;

  @ManyToOne(() => User, user => user.challengeParticipations)
  @JoinColumn({ name: 'utilisateur_id' })
  utilisateur: User;

  @ManyToOne(() => Challenge, challenge => challenge.participations)
  @JoinColumn({ name: 'challenge_id' })
  challenge: Challenge;

  @Column({ type: 'enum', enum: ParticipationStatus, default: ParticipationStatus.INSCRIT })
  statut: ParticipationStatus;

  @Column({ type: 'integer', default: 0 })
  progression: number;

  @Column({ type: 'json', nullable: true })
  objectifs_atteints: object;

  @Column({ type: 'timestamp', nullable: true })
  date_debut: Date;

  @Column({ type: 'timestamp', nullable: true })
  date_fin: Date;

  @Column({ type: 'integer', default: 0 })
  points_gagnes: number;

  @Column({ type: 'text', nullable: true })
  commentaires: string;

  @Column({ type: 'json', nullable: true })
  details_participation: object;

  @CreateDateColumn({ type: 'timestamp' })
  date_creation: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  date_maj: Date;
}

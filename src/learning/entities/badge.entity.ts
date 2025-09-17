import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { User } from '../../users/users.entity';
import { UserBadge } from './user-badge.entity';

export enum BadgeType {
  BRONZE = 'bronze',
  ARGENT = 'argent',
  OR = 'or',
  PLATINE = 'platine'
}

export enum BadgeCategory {
  PREMIER_PAS = 'premier_pas',
  VIGILANCE = 'vigilance',
  QUIZ = 'quiz',
  ASSIDUITE = 'assiduite',
  EXPERT = 'expert',
  DEFENSEUR = 'defenseur',
  SIMULATION = 'simulation',
  CERTIFICATION = 'certification'
}

@Entity('badges')
export class Badge {
  @PrimaryGeneratedColumn()
  badge_id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  nom: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: BadgeType })
  type: BadgeType;

  @Column({ type: 'enum', enum: BadgeCategory })
  categorie: BadgeCategory;

  @Column({ type: 'varchar', length: 255, nullable: true })
  icone_url: string;

  @Column({ type: 'integer', default: 0 })
  points_requis: number;

  @Column({ type: 'integer', default: 0 })
  points_attribues: number;

  @Column({ type: 'boolean', default: false })
  est_secret: boolean;

  @Column({ type: 'text', nullable: true })
  conditions_obtention: string;

  @CreateDateColumn({ type: 'timestamp' })
  date_creation: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  date_maj: Date;

  // Relations
  @OneToMany(() => UserBadge, userBadge => userBadge.badge, { onDelete: 'CASCADE' })
  userBadges: UserBadge[];
}

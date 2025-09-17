import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../users/users.entity';
import { SimulationResponse } from './simulation-response.entity';

export enum SimulationType {
  PHISHING_EMAIL = 'phishing_email',
  VISHING = 'vishing',
  SMISHING = 'smishing',
  RANSOMWARE = 'ransomware',
  SOCIAL_ENGINEERING = 'social_engineering'
}

export enum SimulationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed'
}

@Entity('simulations')
export class Simulation {
  @PrimaryGeneratedColumn()
  simulation_id: number;

  @Column({ type: 'varchar', length: 200 })
  titre: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: SimulationType })
  type: SimulationType;

  @Column({ type: 'enum', enum: SimulationStatus, default: SimulationStatus.ACTIVE })
  statut: SimulationStatus;

  @Column({ type: 'text' })
  contenu_simulation: string;

  @Column({ type: 'json', nullable: true })
  parametres_simulation: object;

  @Column({ type: 'integer', default: 0 })
  points_reussite: number;

  @Column({ type: 'integer', default: 0 })
  points_echec: number;

  @Column({ type: 'integer', default: 0 })
  duree_estimee: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  taux_reussite: number;

  @Column({ type: 'integer', default: 0 })
  nombre_participants: number;

  @Column({ type: 'timestamp', nullable: true })
  date_debut: Date;

  @Column({ type: 'timestamp', nullable: true })
  date_fin: Date;

  @Column({ type: 'boolean', default: false })
  est_obligatoire: boolean;

  @Column({ type: 'text', nullable: true })
  instructions: string;

  @Column({ type: 'text', nullable: true })
  feedback_succes: string;

  @Column({ type: 'text', nullable: true })
  feedback_echec: string;

  @CreateDateColumn({ type: 'timestamp' })
  date_creation: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  date_maj: Date;

  // Relations
  @OneToMany(() => SimulationResponse, response => response.simulation, { onDelete: 'CASCADE' })
  reponses: SimulationResponse[];
}

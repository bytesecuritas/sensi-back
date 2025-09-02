import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/users.entity';
import { Simulation } from './simulation.entity';

export enum SimulationResponseStatus {
  EN_ATTENTE = 'en_attente',
  REUSSIE = 'reussie',
  ECHOUEE = 'echouee',
  IGNOREE = 'ignoree'
}

@Entity('simulation_responses')
export class SimulationResponse {
  @PrimaryGeneratedColumn()
  simulation_response_id: number;

  @ManyToOne(() => User, user => user.simulationResponses)
  @JoinColumn({ name: 'utilisateur_id' })
  utilisateur: User;

  @ManyToOne(() => Simulation, simulation => simulation.reponses)
  @JoinColumn({ name: 'simulation_id' })
  simulation: Simulation;

  @Column({ type: 'enum', enum: SimulationResponseStatus, default: SimulationResponseStatus.EN_ATTENTE })
  statut: SimulationResponseStatus;

  @Column({ type: 'text', nullable: true })
  reponse_utilisateur: string;

  @Column({ type: 'integer', default: 0 })
  temps_reponse: number;

  @Column({ type: 'timestamp' })
  date_reception: Date;

  @Column({ type: 'timestamp', nullable: true })
  date_reponse: Date;

  @Column({ type: 'integer', default: 0 })
  points_gagnes: number;

  @Column({ type: 'text', nullable: true })
  feedback_donne: string;

  @Column({ type: 'json', nullable: true })
  details_reponse: object;

  @CreateDateColumn({ type: 'timestamp' })
  date_creation: Date;
}

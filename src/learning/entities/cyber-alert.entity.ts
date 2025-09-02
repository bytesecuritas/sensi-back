import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../users/users.entity';
import { AlertShare } from './alert-share.entity';

export enum AlertLevel {
  FAIBLE = 'faible',
  MOYEN = 'moyen',
  ELEVE = 'eleve',
  CRITIQUE = 'critique'
}

export enum AlertType {
  PHISHING = 'phishing',
  MALWARE = 'malware',
  RANSOMWARE = 'ransomware',
  SOCIAL_ENGINEERING = 'social_engineering',
  VULNERABILITE = 'vulnerabilite',
  BREACH = 'breach',
  AUTRE = 'autre'
}

export enum AlertStatus {
  ACTIVE = 'active',
  ARCHIVEE = 'archivee',
  RESOLUE = 'resolue'
}

@Entity('cyber_alerts')
export class CyberAlert {
  @PrimaryGeneratedColumn()
  alert_id: number;

  @Column({ type: 'varchar', length: 200 })
  titre: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: AlertLevel })
  niveau: AlertLevel;

  @Column({ type: 'enum', enum: AlertType })
  type: AlertType;

  @Column({ type: 'enum', enum: AlertStatus, default: AlertStatus.ACTIVE })
  statut: AlertStatus;

  @Column({ type: 'text', nullable: true })
  contenu_detaille: string;

  @Column({ type: 'json', nullable: true })
  indicateurs: object;

  @Column({ type: 'text', nullable: true })
  conseils_prevention: string;

  @Column({ type: 'text', nullable: true })
  actions_recommandees: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  source: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  url_source: string;

  @Column({ type: 'timestamp', nullable: true })
  date_decouverte: Date;

  @Column({ type: 'timestamp', nullable: true })
  date_expiration: Date;

  @Column({ type: 'boolean', default: false })
  est_urgente: boolean;

  @Column({ type: 'boolean', default: false })
  est_partageable: boolean;

  @Column({ type: 'integer', default: 0 })
  nombre_vues: number;

  @Column({ type: 'integer', default: 0 })
  nombre_partages: number;

  @CreateDateColumn({ type: 'timestamp' })
  date_creation: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  date_maj: Date;

  // Relations
  @OneToMany(() => AlertShare, share => share.alert)
  partages: AlertShare[];
}

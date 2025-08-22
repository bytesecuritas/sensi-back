import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { LearningPath } from './learning-path.entity';
import { MediaContent } from './media-content.entity';
import { Progress } from './progress.entity';

export enum DifficultyLevel {
  FACILE = 'facile',
  MOYEN = 'moyen',
  DIFFICILE = 'difficile',
  EXPERT = 'expert'
}

export enum ThematiqueCyber {
  PHISHING = 'phishing',                   // Hameçonnage
  SOCIAL_ENGINEERING = 'social_engineering', // Ingénierie sociale
  PASSWORD_MANAGEMENT = 'password_management', // Gestion des mots de passe
  RANSOMWARE = 'ransomware',               // Rançongiciels
  DATA_PROTECTION = 'data_protection',     // Protection des données
  MOBILE_SECURITY = 'mobile_security',     // Sécurité mobile
  SOCIAL_MEDIA = 'social_media',           // Sécurité sur réseaux sociaux
  CYBERHARASSMENT = 'cyberharassment',     // Cyberharcèlement
  PRIVACY = 'privacy',                     // Protection de la vie privée
  MALWARE = 'malware',                     // Logiciels malveillants
  SECURE_BROWSING = 'secure_browsing'      // Navigation sécurisée
}

@Entity('module_apprentissage')
export class LearningPathModule {
  @PrimaryGeneratedColumn()
  module_id: number;

  @Column({ type: 'varchar', length: 255 })
  titre: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ 
    type: 'enum', 
    enum: ['debutant', 'intermediaire', 'avance', 'tous'],
    default: 'tous'
  })
  public_cible: string;

  @Column({ type: 'char', length: 2 })
  code_langue: string;

  @Column({ 
    type: 'enum', 
    enum: DifficultyLevel,
    default: DifficultyLevel.MOYEN
  })
  niveau_difficulte: DifficultyLevel;

  @Column({ 
    type: 'enum', 
    enum: ThematiqueCyber,
    default: ThematiqueCyber.SECURE_BROWSING
  })
  thematique_cyber: ThematiqueCyber;

  @Column('simple-array', { nullable: true })
  objectifs_apprentissage: string[];

  @CreateDateColumn({ type: 'timestamp' })
  date_creation: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  date_maj: Date;

  // Relation avec le parcours d'apprentissage
  @ManyToOne(() => LearningPath, parcours => parcours.modules)
  @JoinColumn({ name: 'parcours_id' })
  parcours: LearningPath;

  // Relation avec les contenus médias
  @OneToMany(() => MediaContent, media => media.module)
  contenus_media: MediaContent[];

  // Relation avec les progressions
  @OneToMany(() => Progress, progression => progression.module)
  progressions: Progress[];
}

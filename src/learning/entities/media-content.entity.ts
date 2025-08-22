import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { LearningPathModule } from './learning-module.entity';

export enum ContentType {
  VIDEO = 'video',               // Contenu vidéo explicatif
  PDF = 'pdf',                  // Document PDF
  QUIZ = 'quiz',                // Questionnaire interactif
  INTERACTIF = 'interactif',    // Contenu nécessitant une interaction
  AUDIO = 'audio',              // Contenu audio uniquement
  SIMULATION = 'simulation',    // Simulation d'attaques
  JEU_SERIEUX = 'jeu_serieux',  // Serious games
  BANDE_DESSINEE = 'bande_dessinee', // Pour les enfants
  ETUDE_DE_CAS = 'etude_de_cas' // Cas réels d'attaques
}

export enum AttackType {
  PHISHING_EMAIL = 'phishing_email',       // Email d'hameçonnage
  FAKE_WEBSITE = 'fake_website',           // Faux site web
  MALICIOUS_ATTACHMENT = 'malicious_attachment', // Pièce jointe malveillante
  SOCIAL_MEDIA_SCAM = 'social_media_scam', // Arnaque sur réseaux sociaux
  USB_DROP = 'usb_drop',                   // Clé USB piégée
  SMISHING = 'smishing',                   // SMS frauduleux
  VISHING = 'vishing',                     // Appel vocal frauduleux
  FAKE_APP = 'fake_app'                    // Application malveillante
}

@Entity('contenu_media')
export class MediaContent {
  @PrimaryGeneratedColumn()
  media_id: number;

  // Relation avec le module d'apprentissage
  @ManyToOne(() => LearningPathModule, module => module.contenus_media)
  @JoinColumn({ name: 'module_id' })
  module: LearningPathModule;

  @Column({ 
    type: 'enum', 
    enum: ContentType,
    default: ContentType.VIDEO
  })
  type_contenu: ContentType;
  
  @Column({ type: 'integer' })
  duree_minutes: number;

  @Column({ type: 'varchar', length: 255, nullable:true })
  url_fichier: string; // URL externe du contenu (si hébergé en dehors du serveur)

  @Column({ type: 'varchar', length: 255 })
  nom_fichier: string;
  
  @Column({ type: 'varchar', length: 255, nullable: true })
  chemin_stockage: string; // Chemin local sur le serveur: src/resource/[nom_parcours]/[nom_module]/[nom_fichier]

  @Column({ type: 'bigint' })
  taille_fichier: number;

  @Column({ type: 'text' })
  description: string;

  @CreateDateColumn({ type: 'timestamp' })
  date_creation: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  date_maj: Date;

  @Column({ 
    type: 'enum', 
    enum: AttackType,
    nullable: true 
  })
  type_attaque: AttackType;
}

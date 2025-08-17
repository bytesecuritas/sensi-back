import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { LearningPathModule } from './learning-module.entity';

export enum MediaType {
  VIDEO = 'video',
  PDF = 'pdf',
  IMAGE = 'image',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  PRESENTATION = 'presentation'
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

  @Column({ type: 'bigint' })
  module_id: number;

  @Column({ 
    type: 'enum', 
    enum: MediaType,
    default: MediaType.VIDEO
  })
  type_media: MediaType;

  @Column({ type: 'varchar', length: 255 })
  url_fichier: string;

  @Column({ type: 'varchar', length: 255 })
  nom_fichier: string;

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

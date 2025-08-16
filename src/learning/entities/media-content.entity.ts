import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { LearningModule } from './learning-module.entity';

export enum MediaType {
  VIDEO = 'video',
  PDF = 'pdf',
  IMAGE = 'image',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  PRESENTATION = 'presentation'
}

@Entity('contenu_media')
export class MediaContent {
  @PrimaryGeneratedColumn()
  media_id: number;

  // Relation avec le module d'apprentissage
  @ManyToOne(() => LearningModule, module => module.contenus_media)
  @JoinColumn({ name: 'module_id' })
  module: LearningModule;

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

  @Column({ type: 'bigint', nullable: true })
  attaque_id: number;
}

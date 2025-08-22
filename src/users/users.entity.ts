import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Organisation } from '../organisations/organisations.entity';
import { Certification } from '../learning/entities/certification.entity';
import { Progress } from '../learning/entities/progress.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  users_id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 200 })
  nom: string;

  @Column({ type: 'varchar', length: 100 })
  prenom: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'enum', enum: ['user', 'admin', 'superadmin'] })
  role: string;

  @ManyToOne(() => Organisation, organisation => organisation.utilisateurs, { nullable: true })
  @JoinColumn({ name: 'organisation_id' })
  organisation: Organisation;

  @Column({ type: 'integer' })
  age: number;

  @Column({ type: 'char', length: 2 })
  code_langue: string;

  @CreateDateColumn({ type: 'timestamp' })
  date_creation: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  date_maj: Date;

  // Relations avec les entités d'apprentissage
  @OneToMany(() => Certification, certification => certification.utilisateur)
  certifications: Certification[];

  @OneToMany(() => Progress, progression => progression.utilisateur)
  progressions: Progress[];
}
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organisation } from '../organisations/organisations.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  users_id: number;

  @Column({ type: 'varchar', length: 255 })
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
}
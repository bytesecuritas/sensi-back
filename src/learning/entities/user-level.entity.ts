import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/users.entity';

export enum UserLevelEnum {
  DEBUTANT = 'debutant',
  INTERMEDIAIRE = 'intermediaire',
  AVANCE = 'avance',
  EXPERT = 'expert',
  MAITRE = 'maitre'
}

@Entity('user_levels')
export class UserLevel {
  @PrimaryGeneratedColumn()
  user_level_id: number;

  @OneToOne(() => User, user => user.userLevel)
  @JoinColumn({ name: 'utilisateur_id' })
  utilisateur: User;

  @Column({ type: 'enum', enum: UserLevelEnum, default: UserLevelEnum.DEBUTANT })
  niveau_actuel: UserLevelEnum;

  @Column({ type: 'integer', default: 0 })
  points_totaux: number;

  @Column({ type: 'integer', default: 0 })
  points_niveau_actuel: number;

  @Column({ type: 'integer', default: 0 })
  points_pour_niveau_suivant: number;

  @Column({ type: 'integer', default: 0 })
  modules_completes: number;

  @Column({ type: 'integer', default: 0 })
  quiz_reussis: number;

  @Column({ type: 'integer', default: 0 })
  simulations_reussies: number;

  @Column({ type: 'integer', default: 0 })
  jours_consecutifs: number;

  @Column({ type: 'timestamp', nullable: true })
  derniere_connexion: Date;

  @Column({ type: 'timestamp', nullable: true })
  derniere_activite: Date;

  @CreateDateColumn({ type: 'timestamp' })
  date_creation: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  date_maj: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/users.entity';
import { Badge } from './badge.entity';

@Entity('user_badges')
export class UserBadge {
  @PrimaryGeneratedColumn()
  user_badge_id: number;

  @ManyToOne(() => User, user => user.userBadges)
  @JoinColumn({ name: 'utilisateur_id' })
  utilisateur: User;

  @ManyToOne(() => Badge, badge => badge.userBadges)
  @JoinColumn({ name: 'badge_id' })
  badge: Badge;

  @Column({ type: 'timestamp' })
  date_obtention: Date;

  @Column({ type: 'text', nullable: true })
  contexte_obtention: string;

  @Column({ type: 'integer', default: 0 })
  points_gagnes: number;

  @CreateDateColumn({ type: 'timestamp' })
  date_creation: Date;
}

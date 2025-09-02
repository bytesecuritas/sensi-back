import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/users.entity';
import { CyberAlert } from './cyber-alert.entity';

@Entity('alert_shares')
export class AlertShare {
  @PrimaryGeneratedColumn()
  share_id: number;

  @ManyToOne(() => User, user => user.alertShares)
  @JoinColumn({ name: 'utilisateur_id' })
  utilisateur: User;

  @ManyToOne(() => CyberAlert, alert => alert.partages)
  @JoinColumn({ name: 'alert_id' })
  alert: CyberAlert;

  @Column({ type: 'varchar', length: 255, nullable: true })
  destinataire: string;

  @Column({ type: 'text', nullable: true })
  message_accompagnement: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  canal_partage: string;

  @Column({ type: 'boolean', default: false })
  est_lu: boolean;

  @Column({ type: 'timestamp', nullable: true })
  date_lecture: Date;

  @CreateDateColumn({ type: 'timestamp' })
  date_creation: Date;
}

import {
  Column, Entity, PrimaryColumn,
} from 'typeorm';
import { NotificationType } from 'src/modules/notification/constants';

@Entity('notification')
export class NotificationEntity {
  @PrimaryColumn({ nullable: false, type: 'varchar', enum: NotificationType })
  type: NotificationType;

  @PrimaryColumn({ nullable: false })
  timestamp: number;

  @Column({ nullable: false })
  title: string;

  @Column({ nullable: true })
  category?: string;

  @Column({ nullable: true })
  categoryColor?: string;

  @Column({ nullable: false, type: 'text' })
  body: string;

  @Column({ nullable: false, default: false })
  read?: boolean = false;

  constructor(entity: Partial<NotificationEntity>) {
    Object.assign(this, entity);
  }
}

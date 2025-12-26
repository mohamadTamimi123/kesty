import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { TicketMessage } from './ticket-message.entity';

@Entity('ticket_attachments')
@Index(['messageId'])
export class TicketAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'message_id', type: 'uuid' })
  messageId: string;

  @ManyToOne(() => TicketMessage, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'message_id' })
  message: TicketMessage;

  @Column({ type: 'varchar', length: 500 })
  fileUrl: string;

  @Column({ type: 'varchar', length: 255 })
  fileName: string;

  @Column({ type: 'varchar', length: 50 })
  mimeType: string;

  @Column({ type: 'bigint' })
  fileSize: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}


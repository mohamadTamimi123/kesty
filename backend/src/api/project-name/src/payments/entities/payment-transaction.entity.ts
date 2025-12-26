import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Payment } from './payment.entity';

@Entity('payment_transactions')
@Index(['paymentId'])
@Index(['authority'])
export class PaymentTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'payment_id', type: 'uuid' })
  paymentId: string;

  @ManyToOne(() => Payment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payment_id' })
  payment: Payment;

  @Column({ type: 'varchar', length: 100, nullable: true })
  authority: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  refId: string | null;

  @Column({ type: 'text', nullable: true })
  response: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}


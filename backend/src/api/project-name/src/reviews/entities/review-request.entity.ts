import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Portfolio } from '../../portfolio/entities/portfolio.entity';
import { User } from '../../users/entities/user.entity';

export enum ReviewRequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

@Entity('review_requests')
export class ReviewRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'portfolio_id', type: 'uuid' })
  @Index()
  portfolioId: string;

  @ManyToOne(() => Portfolio)
  @JoinColumn({ name: 'portfolio_id' })
  portfolio: Portfolio;

  @Column({ name: 'supplier_id', type: 'uuid' })
  @Index()
  supplierId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'supplier_id' })
  supplier: User;

  @Column({ name: 'customer_id', type: 'uuid', nullable: true })
  @Index()
  customerId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer: User | null;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  @Index()
  token: string | null;

  @Column({ name: 'customer_name', type: 'varchar', length: 255, nullable: true })
  customerName: string | null;

  @Column({ name: 'customer_email', type: 'varchar', length: 255, nullable: true })
  customerEmail: string | null;

  @Column({
    type: 'enum',
    enum: ReviewRequestStatus,
    default: ReviewRequestStatus.PENDING,
  })
  status: ReviewRequestStatus;

  @Column({ type: 'text', nullable: true })
  message: string | null;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}


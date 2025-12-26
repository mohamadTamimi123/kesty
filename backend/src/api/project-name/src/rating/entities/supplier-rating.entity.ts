import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('supplier_ratings')
export class SupplierRating {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'supplier_id', type: 'uuid', unique: true })
  @Index()
  supplierId: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'supplier_id' })
  supplier: User;

  @Column({ name: 'total_score', type: 'decimal', precision: 5, scale: 2, default: 0 })
  totalScore: number;

  @Column({ name: 'premium_score', type: 'decimal', precision: 5, scale: 2, default: 0 })
  premiumScore: number;

  @Column({ name: 'review_score', type: 'decimal', precision: 5, scale: 2, default: 0 })
  reviewScore: number;

  @Column({ name: 'profile_score', type: 'decimal', precision: 5, scale: 2, default: 0 })
  profileScore: number;

  @Column({ name: 'response_score', type: 'decimal', precision: 5, scale: 2, default: 0 })
  responseScore: number;

  @Column({ name: 'activity_score', type: 'decimal', precision: 5, scale: 2, default: 0 })
  activityScore: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  penalties: number;

  @Column({ name: 'last_calculated_at', type: 'timestamp', nullable: true })
  lastCalculatedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}


import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { City } from '../../cities/entities/city.entity';
import { Category } from '../../categories/entities/category.entity';
import { Machine } from '../../machines/entities/machine.entity';
import { ProjectFile } from './project-file.entity';

export enum ProjectStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum QuantityEstimate {
  LESS_THAN_10 = 'LESS_THAN_10',
  BETWEEN_10_100 = 'BETWEEN_10_100',
  MORE_THAN_100 = 'MORE_THAN_100',
}

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  @Index()
  customerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'customer_id' })
  customer: User;

  @Column({ name: 'city_id', type: 'uuid' })
  @Index()
  cityId: string;

  @ManyToOne(() => City)
  @JoinColumn({ name: 'city_id' })
  city: City;

  @Column({ name: 'category_id', type: 'uuid' })
  @Index()
  categoryId: string;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ name: 'sub_category_id', type: 'uuid', nullable: true })
  @Index()
  subCategoryId: string | null;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'sub_category_id' })
  subCategory: Category | null;

  @Column({ name: 'machine_id', type: 'uuid', nullable: true })
  @Index()
  machineId: string | null;

  @ManyToOne(() => Machine, { nullable: true })
  @JoinColumn({ name: 'machine_id' })
  machine: Machine | null;

  @Column({ name: 'completion_date', type: 'date', nullable: true })
  completionDate: Date | null;

  @Column({ name: 'client_name', type: 'varchar', nullable: true, length: 255 })
  clientName: string | null;

  @Column({
    type: 'enum',
    enum: QuantityEstimate,
    name: 'quantity_estimate',
    nullable: true,
  })
  quantityEstimate: QuantityEstimate | null;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.PENDING,
  })
  status: ProjectStatus;

  @Column({ name: 'is_public', default: true })
  isPublic: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => ProjectFile, (file) => file.project, { cascade: true })
  files: ProjectFile[];
}


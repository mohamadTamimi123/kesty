import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Machine } from './machine.entity';
import { Category } from '../../categories/entities/category.entity';

@Entity('machine_main_category')
@Unique(['machineId', 'mainCategoryId'])
@Index(['machineId'])
@Index(['mainCategoryId'])
export class MachineMainCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'machine_id', type: 'uuid' })
  machineId: string;

  @ManyToOne(() => Machine, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'machine_id' })
  machine: Machine;

  @Column({ name: 'main_category_id', type: 'uuid' })
  mainCategoryId: string;

  @ManyToOne(() => Category, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'main_category_id' })
  mainCategory: Category;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}


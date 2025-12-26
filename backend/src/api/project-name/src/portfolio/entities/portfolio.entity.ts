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
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';
import { Project } from '../../projects/entities/project.entity';
import { PortfolioImage } from './portfolio-image.entity';
import { Machine } from '../../machines/entities/machine.entity';
import { Material } from '../../materials/entities/material.entity';

export enum QuantityRange {
  LESS_THAN_100 = 'LESS_THAN_100',
  BETWEEN_100_1000 = 'BETWEEN_100_1000',
  MORE_THAN_1000 = 'MORE_THAN_1000',
}

@Entity('portfolios')
export class Portfolio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ name: 'supplier_id', type: 'uuid' })
  @Index()
  supplierId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'supplier_id' })
  supplier: User;

  @Column({ name: 'category_id', type: 'uuid' })
  @Index()
  categoryId: string;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ name: 'subcategory_id', type: 'uuid', nullable: true })
  subcategoryId: string | null;

  @Column({ name: 'project_id', type: 'uuid', nullable: true })
  @Index()
  projectId: string | null;

  @ManyToOne(() => Project, { nullable: true })
  @JoinColumn({ name: 'project_id' })
  project: Project | null;

  @Column({ name: 'completion_date', type: 'date' })
  completionDate: Date;

  @Column({
    type: 'enum',
    enum: QuantityRange,
    name: 'quantity_range',
    nullable: true,
  })
  quantityRange: QuantityRange | null;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'customer_name', type: 'varchar', nullable: true, length: 255 })
  customerName: string | null;

  @Column({ name: 'customer_id', type: 'uuid', nullable: true })
  customerId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer: User | null;

  @Column({ name: 'is_public', default: true })
  isPublic: boolean;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  rating: number | null;

  @Column({ name: 'view_count', default: 0 })
  viewCount: number;

  @OneToMany(() => PortfolioImage, (image) => image.portfolio, { cascade: true })
  images: PortfolioImage[];

  @ManyToMany(() => Machine)
  @JoinTable({
    name: 'portfolio_machines',
    joinColumn: { name: 'portfolio_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'machine_id', referencedColumnName: 'id' },
  })
  machines: Machine[];

  @ManyToMany(() => Material)
  @JoinTable({
    name: 'portfolio_materials',
    joinColumn: { name: 'portfolio_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'material_id', referencedColumnName: 'id' },
  })
  materials: Material[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}


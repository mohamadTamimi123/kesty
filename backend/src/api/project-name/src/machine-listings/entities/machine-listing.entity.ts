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
import { Machine } from '../../machines/entities/machine.entity';
import { City } from '../../cities/entities/city.entity';
import { User } from '../../users/entities/user.entity';

export enum ListingType {
  FOR_SALE = 'for_sale',
  FOR_RENT = 'for_rent',
}

export enum MachineCondition {
  NEW = 'new',
  USED = 'used',
}

@Entity('machine_listings')
export class MachineListing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index()
  slug: string;

  @Column({ name: 'supplier_profile_id', type: 'uuid' })
  supplierProfileId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'supplier_profile_id' })
  supplierProfile: User;

  @Column({ name: 'machine_id', type: 'uuid', nullable: true })
  machineId: string | null;

  @ManyToOne(() => Machine, { nullable: true })
  @JoinColumn({ name: 'machine_id' })
  machine: Machine | null;

  @Column({
    type: 'enum',
    enum: ListingType,
    default: ListingType.FOR_SALE,
  })
  listingType: ListingType;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  price: number | null;

  @Column({ name: 'city_id', type: 'uuid' })
  cityId: string;

  @ManyToOne(() => City)
  @JoinColumn({ name: 'city_id' })
  city: City;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: MachineCondition,
    default: MachineCondition.USED,
  })
  condition: MachineCondition;

  @Column({ name: 'contact_phone', type: 'varchar', length: 20 })
  contactPhone: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_sold', default: false })
  isSold: boolean;

  @Column({ name: 'view_count', default: 0 })
  viewCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}


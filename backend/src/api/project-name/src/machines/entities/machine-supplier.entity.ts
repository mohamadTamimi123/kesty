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
import { User } from '../../users/entities/user.entity';

@Entity('machine_supplier')
@Unique(['machineId', 'supplierId'])
@Index(['machineId'])
@Index(['supplierId'])
export class MachineSupplier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'machine_id', type: 'uuid' })
  machineId: string;

  @ManyToOne(() => Machine, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'machine_id' })
  machine: Machine;

  @Column({ name: 'supplier_id', type: 'uuid' })
  supplierId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'supplier_id' })
  supplier: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}


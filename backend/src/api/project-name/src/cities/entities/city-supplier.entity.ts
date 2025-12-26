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
import { City } from './city.entity';
import { User } from '../../users/entities/user.entity';

@Entity('city_supplier')
@Unique(['cityId', 'supplierId'])
@Index(['cityId'])
@Index(['supplierId'])
export class CitySupplier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'city_id', type: 'uuid' })
  cityId: string;

  @ManyToOne(() => City, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'city_id' })
  city: City;

  @Column({ name: 'supplier_id', type: 'uuid' })
  supplierId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'supplier_id' })
  supplier: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}


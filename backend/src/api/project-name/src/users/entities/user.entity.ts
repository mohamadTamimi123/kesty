import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  SUPPLIER = 'SUPPLIER',
  ADMIN = 'ADMIN',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 11 })
  @Index()
  phone: string;

  @Column({ nullable: true, unique: true })
  email: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role: UserRole;

  @Column({ name: 'password_hash', type: 'varchar', nullable: true })
  passwordHash: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_blocked', default: false })
  isBlocked: boolean;

  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @Column({ name: 'phone_verified', default: false })
  phoneVerified: boolean;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt: Date | null;

  @Column({ name: 'last_login_ip', type: 'varchar', nullable: true, length: 45 })
  lastLoginIp: string | null;

  @Column({ name: 'login_count', type: 'int', default: 0 })
  loginCount: number;

  @Column({ name: 'failed_login_attempts', type: 'int', default: 0 })
  failedLoginAttempts: number;

  @Column({ name: 'locked_until', type: 'timestamp', nullable: true })
  lockedUntil: Date | null;

  @Column({ name: 'avatar_url', type: 'varchar', nullable: true })
  avatarUrl: string | null;

  @Column({ name: 'bio', type: 'text', nullable: true })
  bio: string | null;

  @Column({ name: 'address', type: 'text', nullable: true })
  address: string | null;

  @Column({ name: 'city', type: 'varchar', nullable: true, length: 100 })
  city: string | null;

  @Column({ name: 'postal_code', type: 'varchar', nullable: true, length: 20 })
  postalCode: string | null;

  @Column({ name: 'country', type: 'varchar', nullable: true, length: 100 })
  country: string | null;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: Date | null;

  @Column({ name: 'gender', type: 'varchar', nullable: true, length: 20 })
  gender: string | null;

  @Column({ name: 'preferred_language', type: 'varchar', default: 'fa', length: 10 })
  preferredLanguage: string;

  @Column({ name: 'timezone', type: 'varchar', nullable: true, length: 50 })
  timezone: string | null;

  @Column({ name: 'notification_preferences', type: 'jsonb', nullable: true })
  notificationPreferences: Record<string, any> | null;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  // Premium plan fields
  @Column({ name: 'is_premium', default: false })
  isPremium: boolean;

  @Column({
    name: 'premium_level',
    type: 'varchar',
    nullable: true,
    length: 20,
  })
  premiumLevel: string | null; // NONE, BRONZE, SILVER, GOLD

  @Column({ name: 'premium_expires_at', type: 'timestamp', nullable: true })
  premiumExpiresAt: Date | null;

  // Workshop profile fields
  @Column({ name: 'workshop_name', type: 'varchar', nullable: true, length: 255 })
  workshopName: string | null;

  @Column({ name: 'workshop_address', type: 'text', nullable: true })
  workshopAddress: string | null;

  @Column({ name: 'workshop_phone', type: 'varchar', nullable: true, length: 20 })
  workshopPhone: string | null;

  @Column({ name: 'cover_image_url', type: 'varchar', nullable: true, length: 500 })
  coverImageUrl: string | null;

  @Column({ name: 'profile_image_url', type: 'varchar', nullable: true, length: 500 })
  profileImageUrl: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}


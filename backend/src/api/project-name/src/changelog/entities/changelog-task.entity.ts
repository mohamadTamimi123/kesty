import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

export enum ChangeType {
  FEATURE = 'feature',
  BUGFIX = 'bugfix',
  REFACTOR = 'refactor',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  DOCUMENTATION = 'documentation',
}

export enum TestStatus {
  NOT_TESTED = 'not_tested',
  IN_TESTING = 'in_testing',
  PASSED = 'passed',
  FAILED = 'failed',
}

@Entity('changelog_tasks')
export class ChangelogTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.PENDING,
  })
  @Index()
  status: TaskStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string | null;

  @Column({ type: 'int', nullable: true })
  priority: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  assignee: string | null;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  // New fields
  @Column({ type: 'varchar', length: 200, nullable: true })
  @Index()
  relatedPage: string | null;

  @Column({
    type: 'enum',
    enum: ChangeType,
    nullable: true,
  })
  @Index()
  changeType: ChangeType | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @Index()
  relatedModule: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  prLink: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  commitHash: string | null;

  @Column({
    type: 'enum',
    enum: TestStatus,
    default: TestStatus.NOT_TESTED,
  })
  @Index()
  testStatus: TestStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  testedBy: string | null;

  @Column({ type: 'timestamp', nullable: true })
  testedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  testNotes: string | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  estimatedHours: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  actualHours: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}


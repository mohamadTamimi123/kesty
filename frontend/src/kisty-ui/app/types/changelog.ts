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

export interface ChangelogTask {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  category: string | null;
  priority: number | null;
  assignee: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // New fields
  relatedPage: string | null;
  changeType: ChangeType | null;
  relatedModule: string | null;
  prLink: string | null;
  commitHash: string | null;
  testStatus: TestStatus;
  testedBy: string | null;
  testedAt: string | null;
  testNotes: string | null;
  estimatedHours: number | null;
  actualHours: number | null;
}

export interface ChangelogStats {
  total: number;
  done: number;
  pending: number;
  inProgress: number;
}

export interface ChangelogFilters {
  status?: TaskStatus;
  changeType?: ChangeType;
  relatedModule?: string;
  testStatus?: TestStatus;
  search?: string;
}

export interface CreateChangelogTaskData {
  title: string;
  description?: string;
  status?: TaskStatus;
  category?: string;
  priority?: number;
  assignee?: string;
  relatedPage?: string;
  changeType?: ChangeType;
  relatedModule?: string;
  prLink?: string;
  commitHash?: string;
  testStatus?: TestStatus;
  testedBy?: string;
  testedAt?: string;
  testNotes?: string;
  estimatedHours?: number;
  actualHours?: number;
}

export interface UpdateChangelogTaskData {
  title?: string;
  description?: string;
  status?: TaskStatus;
  category?: string;
  priority?: number;
  assignee?: string;
  relatedPage?: string;
  changeType?: ChangeType;
  relatedModule?: string;
  prLink?: string;
  commitHash?: string;
  testStatus?: TestStatus;
  testedBy?: string;
  testedAt?: string;
  testNotes?: string;
  estimatedHours?: number;
  actualHours?: number;
}


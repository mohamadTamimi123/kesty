import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsNumber,
  IsUrl,
  IsDateString,
} from 'class-validator';
import {
  TaskStatus,
  ChangeType,
  TestStatus,
} from '../entities/changelog-task.entity';

export class UpdateChangelogTaskDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsString()
  @IsOptional()
  category?: string;

  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  priority?: number;

  @IsString()
  @IsOptional()
  assignee?: string;

  // New fields
  @IsString()
  @IsOptional()
  relatedPage?: string;

  @IsEnum(ChangeType)
  @IsOptional()
  changeType?: ChangeType;

  @IsString()
  @IsOptional()
  relatedModule?: string;

  @IsUrl()
  @IsOptional()
  prLink?: string;

  @IsString()
  @IsOptional()
  commitHash?: string;

  @IsEnum(TestStatus)
  @IsOptional()
  testStatus?: TestStatus;

  @IsString()
  @IsOptional()
  testedBy?: string;

  @IsDateString()
  @IsOptional()
  testedAt?: string;

  @IsString()
  @IsOptional()
  testNotes?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  estimatedHours?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  actualHours?: number;
}


import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import {
  ChangelogTask,
  TaskStatus,
  ChangeType,
  TestStatus,
} from './entities/changelog-task.entity';
import { CreateChangelogTaskDto } from './dto/create-changelog-task.dto';
import { UpdateChangelogTaskDto } from './dto/update-changelog-task.dto';

export interface ChangelogFilters {
  status?: TaskStatus;
  changeType?: ChangeType;
  relatedModule?: string;
  testStatus?: TestStatus;
  search?: string;
}

@Injectable()
export class ChangelogService {
  constructor(
    @InjectRepository(ChangelogTask)
    private changelogRepository: Repository<ChangelogTask>,
  ) {}

  async findAll(filters?: ChangelogFilters): Promise<ChangelogTask[]> {
    const query = this.changelogRepository.createQueryBuilder('task');

    if (filters?.status) {
      query.andWhere('task.status = :status', { status: filters.status });
    }

    if (filters?.changeType) {
      query.andWhere('task.changeType = :changeType', {
        changeType: filters.changeType,
      });
    }

    if (filters?.relatedModule) {
      query.andWhere('task.relatedModule = :relatedModule', {
        relatedModule: filters.relatedModule,
      });
    }

    if (filters?.testStatus) {
      query.andWhere('task.testStatus = :testStatus', {
        testStatus: filters.testStatus,
      });
    }

    if (filters?.search) {
      query.andWhere(
        '(task.title LIKE :search OR task.description LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    return query.orderBy('task.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<ChangelogTask> {
    const task = await this.changelogRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }

  async create(createDto: CreateChangelogTaskDto): Promise<ChangelogTask> {
    const task = this.changelogRepository.create({
      ...createDto,
      status: createDto.status || TaskStatus.PENDING,
    });
    return this.changelogRepository.save(task);
  }

  async update(
    id: string,
    updateDto: UpdateChangelogTaskDto,
  ): Promise<ChangelogTask> {
    const task = await this.findOne(id);

    // If status is being updated to DONE, set completedAt
    if (updateDto.status === TaskStatus.DONE && task.status !== TaskStatus.DONE) {
      updateDto['completedAt'] = new Date();
    } else if (updateDto.status !== TaskStatus.DONE && task.status === TaskStatus.DONE) {
      updateDto['completedAt'] = null;
    }

    // If testStatus is being updated to PASSED or FAILED, set testedAt
    if (
      updateDto.testStatus &&
      (updateDto.testStatus === TestStatus.PASSED ||
        updateDto.testStatus === TestStatus.FAILED) &&
      task.testStatus !== updateDto.testStatus
    ) {
      updateDto['testedAt'] = new Date().toISOString();
    }

    // Convert testedAt string to ISO string if provided (already a string, just ensure format)
    if (updateDto.testedAt && typeof updateDto.testedAt === 'string') {
      // Validate it's a valid date string, if not convert
      const date = new Date(updateDto.testedAt);
      if (!isNaN(date.getTime())) {
        updateDto['testedAt'] = date.toISOString();
      }
    }

    Object.assign(task, updateDto);
    return this.changelogRepository.save(task);
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);
    await this.changelogRepository.remove(task);
  }

  async getStats() {
    const [total, done, pending, inProgress] = await Promise.all([
      this.changelogRepository.count(),
      this.changelogRepository.count({ where: { status: TaskStatus.DONE } }),
      this.changelogRepository.count({ where: { status: TaskStatus.PENDING } }),
      this.changelogRepository.count({ where: { status: TaskStatus.IN_PROGRESS } }),
    ]);

    return {
      total,
      done,
      pending,
      inProgress,
    };
  }
}


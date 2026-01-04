import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Repository, In, SelectQueryBuilder } from 'typeorm';
import { Project, ProjectStatus, QuantityEstimate } from './entities/project.entity';
import { ProjectFile } from './entities/project-file.entity';
import { UpdateProjectDto } from './dto/update-project.dto';
import { DistributeProjectJobDto } from '../project-distribution/dto/distribute-project-job.dto';
import { CacheService } from '../common/services/cache.service';

@Injectable()
export class ProjectsService {
  private readonly CACHE_TTL = 600; // 10 minutes
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(ProjectFile)
    private projectFilesRepository: Repository<ProjectFile>,
    @InjectQueue('project-distribution')
    private projectDistributionQueue: Queue<DistributeProjectJobDto>,
    private cacheService: CacheService,
  ) {}

  async create(projectData: {
    title: string;
    description: string;
    customerId: string;
    cityId: string;
    categoryId: string;
    subCategoryId?: string;
    machineId?: string;
    completionDate?: Date | string;
    clientName?: string;
    quantityEstimate?: QuantityEstimate;
    isPublic?: boolean;
  }): Promise<Project> {
    const project = this.projectsRepository.create({
      title: projectData.title,
      description: projectData.description,
      customerId: projectData.customerId,
      cityId: projectData.cityId,
      categoryId: projectData.categoryId,
      subCategoryId: projectData.subCategoryId || null,
      machineId: projectData.machineId || null,
      completionDate: projectData.completionDate ? new Date(projectData.completionDate) : null,
      clientName: projectData.clientName || null,
      quantityEstimate: projectData.quantityEstimate || null,
      isPublic: projectData.isPublic !== undefined ? projectData.isPublic : true,
      status: ProjectStatus.PENDING,
    });

    const savedProject = await this.projectsRepository.save(project);
    
    // Queue project distribution to relevant suppliers (non-blocking)
    try {
      await this.projectDistributionQueue.add('distribute-project', {
        projectId: savedProject.id,
      });
      this.logger.log(
        `Project distribution queued successfully for project ${savedProject.id}`,
        {
          projectId: savedProject.id,
          customerId: projectData.customerId,
          categoryId: projectData.categoryId,
          cityId: projectData.cityId,
        },
      );
    } catch (error) {
      // Log error but don't fail project creation
      this.logger.error(
        `Error queuing project distribution for project ${savedProject.id}`,
        error instanceof Error ? error.stack : String(error),
        {
          projectId: savedProject.id,
          customerId: projectData.customerId,
          categoryId: projectData.categoryId,
          cityId: projectData.cityId,
          error: error instanceof Error ? error.message : String(error),
        },
      );
      // Error is logged but project creation continues
      // Project is created successfully, distribution will be retried later if needed
    }

    return savedProject;
  }

  async findAll(page: number = 1, limit: number = 10): Promise<{ data: Project[]; total: number; page: number; limit: number; totalPages: number }> {
    const queryBuilder = this.projectsRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.customer', 'customer')
      .leftJoinAndSelect('project.city', 'city')
      .leftJoinAndSelect('project.category', 'category')
      .leftJoinAndSelect('project.subCategory', 'subCategory')
      .leftJoinAndSelect('project.machine', 'machine')
      .leftJoinAndSelect('project.files', 'files')
      .select([
        'project.id',
        'project.title',
        'project.description',
        'project.status',
        'project.isPublic',
        'project.createdAt',
        'project.updatedAt',
        'customer.id',
        'customer.fullName',
        'city.id',
        'city.title',
        'city.slug',
        'category.id',
        'category.title',
        'category.slug',
        'subCategory.id',
        'subCategory.title',
        'subCategory.slug',
        'machine.id',
        'machine.name',
        'files.id',
        'files.fileUrl',
        'files.fileName',
      ])
      .orderBy('project.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findPublic(page: number = 1, limit: number = 10): Promise<{ data: Project[]; total: number; page: number; limit: number; totalPages: number }> {
    const cacheKey = `projects:public:${page}:${limit}`;
    
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const queryBuilder = this.projectsRepository
          .createQueryBuilder('project')
          .leftJoinAndSelect('project.customer', 'customer')
          .leftJoinAndSelect('project.city', 'city')
          .leftJoinAndSelect('project.category', 'category')
          .leftJoinAndSelect('project.subCategory', 'subCategory')
          .leftJoinAndSelect('project.machine', 'machine')
          .leftJoinAndSelect('project.files', 'files')
          .where('project.isPublic = :isPublic', { isPublic: true })
          .andWhere('project.status = :status', { status: ProjectStatus.PENDING })
          .select([
            'project.id',
            'project.title',
            'project.description',
            'project.status',
            'project.isPublic',
            'project.createdAt',
            'project.updatedAt',
            'customer.id',
            'customer.fullName',
            'city.id',
            'city.title',
            'city.slug',
            'category.id',
            'category.title',
            'category.slug',
            'subCategory.id',
            'subCategory.title',
            'subCategory.slug',
            'machine.id',
            'machine.name',
            'files.id',
            'files.fileUrl',
            'files.fileName',
          ])
          .orderBy('project.createdAt', 'DESC')
          .skip((page - 1) * limit)
          .take(limit);

        const [data, total] = await queryBuilder.getManyAndCount();
        
        return {
          data,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        };
      },
      this.CACHE_TTL,
    );
  }

  async findByCustomer(customerId: string, page: number = 1, limit: number = 10): Promise<{ data: Project[]; total: number; page: number; limit: number; totalPages: number }> {
    const queryBuilder = this.projectsRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.customer', 'customer')
      .leftJoinAndSelect('project.city', 'city')
      .leftJoinAndSelect('project.category', 'category')
      .leftJoinAndSelect('project.subCategory', 'subCategory')
      .leftJoinAndSelect('project.machine', 'machine')
      .leftJoinAndSelect('project.files', 'files')
      .where('project.customerId = :customerId', { customerId })
      .select([
        'project.id',
        'project.title',
        'project.description',
        'project.status',
        'project.isPublic',
        'project.createdAt',
        'project.updatedAt',
        'customer.id',
        'customer.fullName',
        'city.id',
        'city.title',
        'city.slug',
        'category.id',
        'category.title',
        'category.slug',
        'subCategory.id',
        'subCategory.title',
        'subCategory.slug',
        'machine.id',
        'machine.name',
        'files.id',
        'files.fileUrl',
        'files.fileName',
      ])
      .orderBy('project.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByCategoryAndCity(categoryId: string, cityId: string): Promise<Project[]> {
    return this.projectsRepository.find({
      where: { categoryId, cityId, isPublic: true },
      relations: ['customer', 'city', 'category', 'subCategory', 'machine', 'files'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Project | null> {
    return this.projectsRepository.findOne({
      where: { id },
      relations: ['customer', 'city', 'category', 'subCategory', 'machine', 'files'],
    });
  }

  async findByIds(ids: string[]): Promise<Project[]> {
    if (!ids || ids.length === 0) {
      return [];
    }
    return this.projectsRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.customer', 'customer')
      .leftJoinAndSelect('project.city', 'city')
      .leftJoinAndSelect('project.category', 'category')
      .leftJoinAndSelect('project.subCategory', 'subCategory')
      .leftJoinAndSelect('project.machine', 'machine')
      .leftJoinAndSelect('project.files', 'files')
      .where('project.id IN (:...ids)', { ids })
      .select([
        'project.id',
        'project.title',
        'project.description',
        'project.status',
        'project.isPublic',
        'project.createdAt',
        'project.updatedAt',
        'customer.id',
        'customer.fullName',
        'city.id',
        'city.title',
        'city.slug',
        'category.id',
        'category.title',
        'category.slug',
        'subCategory.id',
        'subCategory.title',
        'subCategory.slug',
        'machine.id',
        'machine.name',
        'files.id',
        'files.fileUrl',
        'files.fileName',
      ])
      .getMany();
  }

  /**
   * Find public projects filtered by supplier's categories and cities
   * Optimized for supplier dashboard with pagination support
   */
  async findRelevantForSupplier(
    categoryIds: string[],
    cityIds: string[],
    subCategoryIds: string[] = [],
    limit: number = 10,
    page: number = 1,
    cursor?: string,
  ): Promise<{ data: Project[]; total: number; page: number; limit: number; totalPages: number; hasMore: boolean }> {
    // Create cache key based on filters and pagination
    const cacheKey = `projects:relevant:${categoryIds.join(',')}:${cityIds.join(',')}:${subCategoryIds.join(',')}:${limit}:${page}:${cursor || ''}`;
    
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const queryBuilder = this.projectsRepository
          .createQueryBuilder('project')
          .leftJoinAndSelect('project.customer', 'customer')
          .leftJoinAndSelect('project.city', 'city')
          .leftJoinAndSelect('project.category', 'category')
          .leftJoinAndSelect('project.subCategory', 'subCategory')
          .leftJoinAndSelect('project.machine', 'machine')
          .leftJoinAndSelect('project.files', 'files')
          .where('project.isPublic = :isPublic', { isPublic: true })
          .andWhere('project.status = :status', { status: ProjectStatus.PENDING })
          .select([
            'project.id',
            'project.title',
            'project.description',
            'project.status',
            'project.isPublic',
            'project.createdAt',
            'project.updatedAt',
            'project.categoryId',
            'project.subCategoryId',
            'project.cityId',
            'customer.id',
            'customer.fullName',
            'city.id',
            'city.title',
            'city.slug',
            'category.id',
            'category.title',
            'category.slug',
            'subCategory.id',
            'subCategory.title',
            'subCategory.slug',
            'machine.id',
            'machine.name',
            'files.id',
            'files.fileUrl',
            'files.fileName',
            'files.mimeType',
          ])
          .orderBy('project.createdAt', 'DESC');

        // Cursor-based pagination for better performance
        if (cursor) {
          queryBuilder.andWhere('project.createdAt < :cursor', { cursor: new Date(cursor) });
        }

        // Build filter conditions - optimized to use indexes
        if (categoryIds.length > 0 || cityIds.length > 0 || subCategoryIds.length > 0) {
          const conditions: string[] = [];
          const parameters: Record<string, any> = {};

          if (categoryIds.length > 0) {
            // Use categoryId directly for better index usage
            conditions.push('project.categoryId IN (:...categoryIds)');
            parameters.categoryIds = categoryIds;
          }

          if (subCategoryIds.length > 0) {
            // Use subCategoryId directly for better index usage
            conditions.push('project.subCategoryId IN (:...subCategoryIds)');
            parameters.subCategoryIds = subCategoryIds;
          }

          if (cityIds.length > 0) {
            // Use cityId directly for better index usage
            conditions.push('project.cityId IN (:...cityIds)');
            parameters.cityIds = cityIds;
          }

          if (conditions.length > 0) {
            queryBuilder.andWhere(`(${conditions.join(' OR ')})`, parameters);
          }
        }

        // Apply pagination
        const skip = (page - 1) * limit;
        queryBuilder.skip(skip).take(limit + 1); // Fetch one extra to check if there's more

        const results = await queryBuilder.getMany();
        const hasMore = results.length > limit;
        const data = hasMore ? results.slice(0, limit) : results;

        // Get total count (cached separately for performance)
        const countCacheKey = `projects:relevant:count:${categoryIds.join(',')}:${cityIds.join(',')}:${subCategoryIds.join(',')}`;
        const total = await this.cacheService.getOrSet(
          countCacheKey,
          async () => {
            const countQuery = this.projectsRepository
              .createQueryBuilder('project')
              .where('project.isPublic = :isPublic', { isPublic: true })
              .andWhere('project.status = :status', { status: ProjectStatus.PENDING });

            if (categoryIds.length > 0 || cityIds.length > 0 || subCategoryIds.length > 0) {
              const conditions: string[] = [];
              const parameters: Record<string, any> = {};

              if (categoryIds.length > 0) {
                conditions.push('project.categoryId IN (:...categoryIds)');
                parameters.categoryIds = categoryIds;
              }

              if (subCategoryIds.length > 0) {
                conditions.push('project.subCategoryId IN (:...subCategoryIds)');
                parameters.subCategoryIds = subCategoryIds;
              }

              if (cityIds.length > 0) {
                conditions.push('project.cityId IN (:...cityIds)');
                parameters.cityIds = cityIds;
              }

              if (conditions.length > 0) {
                countQuery.andWhere(`(${conditions.join(' OR ')})`, parameters);
              }
            }

            return countQuery.getCount();
          },
          this.CACHE_TTL,
        );

        return {
          data,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasMore,
        };
      },
      this.CACHE_TTL,
    );
  }

  async update(id: string, updateData: UpdateProjectDto, userId: string): Promise<Project> {
    const project = await this.findById(id);
    if (!project) {
      throw new NotFoundException(`پروژه با شناسه ${id} یافت نشد`);
    }

    // Check if user owns the project
    if (project.customerId !== userId) {
      throw new ForbiddenException('شما دسترسی به این پروژه ندارید');
    }

    // Convert completionDate string to Date if provided
    const updatePayload: Partial<Project> = {};
    
    // Copy all fields except completionDate
    Object.keys(updateData).forEach((key) => {
      if (key !== 'completionDate') {
        (updatePayload as any)[key] = (updateData as any)[key];
      }
    });
    
    // Handle completionDate conversion
    if (updateData.completionDate !== undefined) {
      if (updateData.completionDate === null) {
        updatePayload.completionDate = null;
      } else if (typeof updateData.completionDate === 'string') {
        updatePayload.completionDate = new Date(updateData.completionDate);
      }
    }

    await this.projectsRepository.update(id, updatePayload);
    const updatedProject = await this.findById(id);
    if (!updatedProject) {
      throw new NotFoundException(`پروژه با شناسه ${id} پس از به‌روزرسانی یافت نشد`);
    }
    return updatedProject;
  }

  async delete(id: string, userId: string): Promise<void> {
    const project = await this.findById(id);
    if (!project) {
      throw new NotFoundException(`پروژه با شناسه ${id} یافت نشد`);
    }

    // Check if user owns the project
    if (project.customerId !== userId) {
      throw new ForbiddenException('شما دسترسی به این پروژه ندارید');
    }

    await this.projectsRepository.delete(id);
    
    // Invalidate cache with tags for more granular control
    await this.cacheService.invalidateTags(['projects:public', 'projects:relevant', `project:${id}`]);
    await this.cacheService.invalidate(`projects:${id}`);
  }

  async addFile(projectId: string, fileData: {
    fileUrl: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
  }): Promise<ProjectFile> {
    const project = await this.findById(projectId);
    if (!project) {
      throw new NotFoundException(`پروژه با شناسه ${projectId} یافت نشد`);
    }

    const file = this.projectFilesRepository.create({
      projectId,
      ...fileData,
    });

    return await this.projectFilesRepository.save(file);
  }

  async removeFile(fileId: string, userId: string): Promise<void> {
    const file = await this.projectFilesRepository.findOne({
      where: { id: fileId },
      relations: ['project'],
    });

    if (!file) {
      throw new NotFoundException(`فایل با شناسه ${fileId} یافت نشد`);
    }

    // Check if user owns the project
    if (file.project.customerId !== userId) {
      throw new ForbiddenException('شما دسترسی به این فایل ندارید');
    }

    await this.projectFilesRepository.delete(fileId);
  }
}


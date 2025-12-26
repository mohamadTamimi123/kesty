import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, ProjectStatus, QuantityEstimate } from './entities/project.entity';
import { ProjectFile } from './entities/project-file.entity';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(ProjectFile)
    private projectFilesRepository: Repository<ProjectFile>,
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
    
    // TODO: Implement notifySuppliers logic here
    // await this.notifySuppliers(savedProject);

    return savedProject;
  }

  async findAll(): Promise<Project[]> {
    return this.projectsRepository.find({
      relations: ['customer', 'city', 'category', 'subCategory', 'machine', 'files'],
      order: { createdAt: 'DESC' },
    });
  }

  async findPublic(): Promise<Project[]> {
    return this.projectsRepository.find({
      where: { isPublic: true, status: ProjectStatus.PENDING },
      relations: ['customer', 'city', 'category', 'subCategory', 'machine', 'files'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByCustomer(customerId: string): Promise<Project[]> {
    return this.projectsRepository.find({
      where: { customerId },
      relations: ['customer', 'city', 'category', 'subCategory', 'machine', 'files'],
      order: { createdAt: 'DESC' },
    });
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


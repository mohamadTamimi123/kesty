import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../projects/entities/project.entity';
import { CategorySupplier } from '../categories/entities/category-supplier.entity';
import { CitySupplier } from '../cities/entities/city-supplier.entity';
import { User } from '../users/entities/user.entity';
import { MessagingService } from '../messaging/messaging.service';

@Injectable()
export class ProjectDistributionService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(CategorySupplier)
    private categorySupplierRepository: Repository<CategorySupplier>,
    @InjectRepository(CitySupplier)
    private citySupplierRepository: Repository<CitySupplier>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private messagingService: MessagingService,
  ) {}

  /**
   * Distribute project request to relevant suppliers
   */
  async distributeProject(projectId: string): Promise<void> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['category', 'city'],
    });

    if (!project) {
      throw new Error(`Project with ID ${projectId} not found`);
    }

    // Find suppliers matching project criteria
    const relevantSuppliers = await this.findRelevantSuppliers(
      project.categoryId,
      project.cityId,
    );

    // Notify each supplier
    for (const supplier of relevantSuppliers) {
      await this.notifySupplier(project, supplier);
    }
  }

  /**
   * Find suppliers relevant to a project
   */
  private async findRelevantSuppliers(
    categoryId: string,
    cityId: string,
  ): Promise<User[]> {
    // Find suppliers with matching category
    const categorySuppliers = await this.categorySupplierRepository.find({
      where: { categoryId },
    });
    const categorySupplierIds = categorySuppliers.map((cs) => cs.supplierId);

    // Find suppliers in the same city
    const citySuppliers = await this.citySupplierRepository.find({
      where: { cityId },
    });
    const citySupplierIds = citySuppliers.map((cs) => cs.supplierId);

    // Find intersection (suppliers matching both criteria)
    const relevantSupplierIds = categorySupplierIds.filter((id) =>
      citySupplierIds.includes(id),
    );

    if (relevantSupplierIds.length === 0) {
      // If no exact match, return suppliers matching at least one criteria
      const allSupplierIds = [
        ...new Set([...categorySupplierIds, ...citySupplierIds]),
      ];
      return this.userRepository.find({
        where: allSupplierIds.map((id) => ({ id })),
      });
    }

    return this.userRepository.find({
      where: relevantSupplierIds.map((id) => ({ id })),
    });
  }

  /**
   * Notify a supplier about a new project
   */
  private async notifySupplier(project: Project, supplier: User): Promise<void> {
    // Create or get conversation
    const conversation = await this.messagingService.getOrCreateConversation(
      project.customerId,
      supplier.id,
    );

    // Send notification message
    await this.messagingService.sendMessage(project.customerId, {
      conversationId: conversation.id,
      content: `یک پروژه جدید در دسته "${project.category.title}" در شهر "${project.city.title}" ثبت شده است.`,
    });

    // TODO: Add email/SMS notification here
  }

  /**
   * Get relevant suppliers for a project (without distributing)
   */
  async getRelevantSuppliers(projectId: string): Promise<User[]> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['category', 'city'],
    });

    if (!project) {
      throw new Error(`Project with ID ${projectId} not found`);
    }

    return this.findRelevantSuppliers(project.categoryId, project.cityId);
  }
}


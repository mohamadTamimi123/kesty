import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import Redis from 'ioredis';
import { Project } from '../projects/entities/project.entity';
import { CategorySupplier } from '../categories/entities/category-supplier.entity';
import { CitySupplier } from '../cities/entities/city-supplier.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { MessagingService } from '../messaging/messaging.service';
import { RatingService } from '../rating/rating.service';

@Injectable()
export class ProjectDistributionService {
  private readonly MAX_SUPPLIERS_TO_NOTIFY = 20;
  private readonly CACHE_TTL = 300; // 5 minutes cache TTL

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
    private ratingService: RatingService,
    @Inject('REDIS_CLIENT')
    private redis: Redis,
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

    // Notify suppliers in parallel batches (max 5 concurrent)
    const BATCH_SIZE = 5;
    for (let i = 0; i < relevantSuppliers.length; i += BATCH_SIZE) {
      const batch = relevantSuppliers.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map((supplier) => this.notifySupplier(project, supplier)),
      );
    }
  }

  /**
   * Find suppliers relevant to a project with advanced matching
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
    const exactMatchIds = categorySupplierIds.filter((id) =>
      citySupplierIds.includes(id),
    );

    // Get all suppliers (exact matches + category matches + city matches)
    const allSupplierIds = [
      ...new Set([...exactMatchIds, ...categorySupplierIds, ...citySupplierIds]),
    ];

    // Fetch suppliers with their active status (optimized query)
    const suppliers = await this.userRepository.find({
      where: { id: In(allSupplierIds) },
      select: [
        'id',
        'fullName',
        'email',
        'phone',
        'isActive',
        'isBlocked',
        'role',
        'lastLoginAt',
        'workshopName',
      ],
    });

    // Filter active suppliers only
    const activeSuppliers = suppliers.filter(
      (supplier) => supplier.isActive && !supplier.isBlocked && supplier.role === UserRole.SUPPLIER,
    );

    // Batch fetch ratings for all suppliers (optimize N+1 query problem with caching)
    const supplierIds = activeSuppliers.map((s) => s.id);
    const ratingsMap = new Map<string, number>();
    
    try {
      // Try to get ratings from cache first
      const cacheKeys = supplierIds.map((id) => `supplier:rating:${id}`);
      const cachedRatings = await Promise.all(
        cacheKeys.map((key) => this.redis.get(key)),
      );
      
      // Fetch missing ratings from database
      const ratingPromises = supplierIds.map(async (id, index) => {
        const cached = cachedRatings[index];
        if (cached) {
          return { id, totalScore: parseFloat(cached) };
        }
        
        try {
          const rating = await this.ratingService.getSupplierRating(id);
          // Cache the rating
          await this.redis.setex(
            `supplier:rating:${id}`,
            this.CACHE_TTL,
            rating.totalScore.toString(),
          );
          return { id, totalScore: rating.totalScore };
        } catch {
          return { id, totalScore: 0 };
        }
      });
      
      const ratings = await Promise.all(ratingPromises);
      ratings.forEach((r) => {
        ratingsMap.set(r.id, r.totalScore);
      });
    } catch (error) {
      // If batch fetch fails, continue without ratings
      console.error('Error batch fetching ratings:', error);
    }

    // Score and rank suppliers (now using cached ratings)
    const suppliersWithScores = activeSuppliers.map((supplier) => {
      let score = 0;

      // Exact match bonus (both category and city): 100 points
      if (exactMatchIds.includes(supplier.id)) {
        score += 100;
      }
      // Category match: 50 points
      else if (categorySupplierIds.includes(supplier.id)) {
        score += 50;
      }
      // City match: 30 points
      else if (citySupplierIds.includes(supplier.id)) {
        score += 30;
      }

      // Rating bonus (up to 40 points) - from cached map
      const rating = ratingsMap.get(supplier.id);
      if (rating) {
        score += (rating / 100) * 40;
      }

      // Activity bonus based on lastLoginAt (up to 10 points)
      if (supplier.lastLoginAt) {
        const daysSinceLogin = Math.floor(
          (Date.now() - new Date(supplier.lastLoginAt).getTime()) / (1000 * 60 * 60 * 24),
        );
        if (daysSinceLogin <= 7) {
          score += 10;
        } else if (daysSinceLogin <= 30) {
          score += 5;
        }
      }

      return { supplier, score };
    });

    // Sort by score (highest first)
    suppliersWithScores.sort((a, b) => b.score - a.score);

    // Return top suppliers (limited to MAX_SUPPLIERS_TO_NOTIFY)
    return suppliersWithScores
      .slice(0, this.MAX_SUPPLIERS_TO_NOTIFY)
      .map((item) => item.supplier);
  }

  /**
   * Notify a supplier about a new project
   */
  private async notifySupplier(project: Project, supplier: User): Promise<void> {
    // Create conversation with projectId - each project gets its own conversation
    const conversation = await this.messagingService.createConversation(
      project.customerId,
      {
        supplierId: supplier.id,
        projectId: project.id,
      },
    );

    // Format project description (limit to 300 chars for message)
    const descriptionPreview = project.description 
      ? (project.description.length > 300 
          ? project.description.substring(0, 300) + '...' 
          : project.description)
      : 'بدون توضیحات';

    // Create a rich notification message with project details
    const messageContent = `🎯 پروژه جدید برای شما

📋 عنوان: ${project.title}

📝 توضیحات:
${descriptionPreview}

🏷️ دسته‌بندی: ${project.category.title}
📍 شهر: ${project.city.title}

💡 این پروژه با مشخصات شما همخوانی دارد. می‌توانید پیشنهاد خود را ارسال کنید.`;

    // Send notification message with metadata for action buttons
    await this.messagingService.sendMessage(project.customerId, {
      conversationId: conversation.id,
      content: messageContent,
      metadata: {
        type: 'project_notification',
        projectId: project.id,
        projectTitle: project.title,
        projectDescription: project.description,
        categoryTitle: project.category.title,
        cityTitle: project.city.title,
      },
    });

    // Email/SMS notification can be added here when email/SMS service is implemented
    // Example:
    // await this.emailService.sendEmail({
    //   to: supplier.email,
    //   subject: 'پروژه جدید در کیستی',
    //   template: 'new-project-notification',
    //   data: { project, supplier }
    // });
    // await this.smsService.sendSMS({
    //   to: supplier.phone,
    //   message: `یک پروژه جدید در دسته ${project.category.title} برای شما ثبت شده است.`
    // });
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

  /**
   * Get excluded suppliers (matching suppliers that were not selected)
   */
  async getExcludedSuppliers(projectId: string): Promise<Array<{
    id: string;
    fullName: string;
    workshopName: string;
    reason: 'low_score' | 'inactive' | 'blocked' | 'limit_reached';
    score?: number;
    matchType?: 'category' | 'city' | 'both';
  }>> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['category', 'city'],
    });

    if (!project) {
      throw new Error(`Project with ID ${projectId} not found`);
    }

    // Find all matching suppliers (before filtering)
    const categorySuppliers = await this.categorySupplierRepository.find({
      where: { categoryId: project.categoryId },
    });
    const categorySupplierIds = categorySuppliers.map((cs) => cs.supplierId);

    const citySuppliers = await this.citySupplierRepository.find({
      where: { cityId: project.cityId },
    });
    const citySupplierIds = citySuppliers.map((cs) => cs.supplierId);

    const exactMatchIds = categorySupplierIds.filter((id) =>
      citySupplierIds.includes(id),
    );

    const allSupplierIds = [
      ...new Set([...exactMatchIds, ...categorySupplierIds, ...citySupplierIds]),
    ];

    // Fetch all suppliers
    const allSuppliers = await this.userRepository.find({
      where: allSupplierIds.map((id) => ({ id })),
    });

    // Get selected suppliers
    const selectedSuppliers = await this.findRelevantSuppliers(
      project.categoryId,
      project.cityId,
    );
    const selectedSupplierIds = new Set(selectedSuppliers.map((s) => s.id));

    // Score all suppliers to determine exclusion reasons
    const suppliersWithScores = await Promise.all(
      allSuppliers.map(async (supplier) => {
        let score = 0;
        let matchType: 'category' | 'city' | 'both' = 'city';

        if (exactMatchIds.includes(supplier.id)) {
          score += 100;
          matchType = 'both';
        } else if (categorySupplierIds.includes(supplier.id)) {
          score += 50;
          matchType = 'category';
        } else if (citySupplierIds.includes(supplier.id)) {
          score += 30;
          matchType = 'city';
        }

        // Rating bonus
        try {
          const rating = await this.ratingService.getSupplierRating(supplier.id);
          score += (rating.totalScore / 100) * 40;
        } catch (error) {
          // Skip if rating not found
        }

        // Activity bonus
        if (supplier.lastLoginAt) {
          const daysSinceLogin = Math.floor(
            (Date.now() - new Date(supplier.lastLoginAt).getTime()) / (1000 * 60 * 60 * 24),
          );
          if (daysSinceLogin <= 7) {
            score += 10;
          } else if (daysSinceLogin <= 30) {
            score += 5;
          }
        }

        return { supplier, score, matchType };
      }),
    );

    // Sort by score
    suppliersWithScores.sort((a, b) => b.score - a.score);

    // Find excluded suppliers
    const excludedSuppliers = suppliersWithScores
      .filter((item) => !selectedSupplierIds.has(item.supplier.id))
      .map((item) => {
        const { supplier, score, matchType } = item;
        let reason: 'low_score' | 'inactive' | 'blocked' | 'limit_reached' = 'low_score';

        // Check status first
        if (!supplier.isActive) {
          reason = 'inactive';
        } else if (supplier.isBlocked) {
          reason = 'blocked';
        } else if (supplier.role !== UserRole.SUPPLIER) {
          reason = 'inactive';
        } else {
          // For active suppliers, check if it's due to limit
          // Get the lowest score among selected suppliers
          const selectedScores = suppliersWithScores
            .filter((s) => selectedSupplierIds.has(s.supplier.id))
            .map((s) => s.score);
          
          const lowestSelectedScore = selectedScores.length > 0 
            ? Math.min(...selectedScores)
            : Infinity;
          
          // If we have selected suppliers and this score is lower, it's limit_reached
          // Otherwise it's low_score (but this shouldn't happen if logic is correct)
          if (selectedScores.length > 0 && score < lowestSelectedScore) {
            reason = 'limit_reached';
          } else {
            reason = 'low_score';
          }
        }

        return {
          id: supplier.id,
          fullName: supplier.fullName,
          workshopName: supplier.workshopName || '',
          reason,
          score,
          matchType,
        };
      });

    return excludedSuppliers;
  }
}


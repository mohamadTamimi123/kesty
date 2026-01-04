import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, ProjectStatus } from '../../projects/entities/project.entity';
import { Quote, QuoteStatus } from '../../quotes/entities/quote.entity';
import { Message } from '../../messaging/entities/message.entity';
import { Portfolio } from '../../portfolio/entities/portfolio.entity';
import { Review } from '../../reviews/entities/review.entity';
import { SupplierRating } from '../../rating/entities/supplier-rating.entity';
import { CacheService } from './cache.service';

@Injectable()
export class SupplierStatsService {
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(Quote)
    private quoteRepository: Repository<Quote>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(Portfolio)
    private portfolioRepository: Repository<Portfolio>,
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(SupplierRating)
    private ratingRepository: Repository<SupplierRating>,
    private cacheService: CacheService,
  ) {}

  async getSupplierStats(supplierId: string) {
    const cacheKey = `supplier:stats:${supplierId}`;
    
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const [
          newRequests,
          activeProjects,
          newMessages,
          totalPortfolios,
          totalReviews,
          averageRating,
        ] = await Promise.all([
          // New project requests (projects with status PENDING that supplier hasn't quoted yet)
          // Optimized: Use NOT EXISTS subquery for better performance
          this.projectRepository
            .createQueryBuilder('project')
            .where('project.status = :status', { status: ProjectStatus.PENDING })
            .andWhere('project.isPublic = :isPublic', { isPublic: true })
            .andWhere(
              `NOT EXISTS (SELECT 1 FROM quotes WHERE quotes.project_id = project.id AND quotes.supplier_id = :supplierId)`,
              { supplierId }
            )
            .getCount(),

          // Active projects (projects where supplier has quotes with status ACCEPTED)
          // Optimized: Use count with indexed fields
          this.quoteRepository
            .createQueryBuilder('quote')
            .where('quote.supplierId = :supplierId', { supplierId })
            .andWhere('quote.status = :status', { status: QuoteStatus.ACCEPTED })
            .getCount(),

          // New messages (messages in last 24 hours in conversations where supplier is involved)
          // Optimized: Use indexed fields and limit date range
          this.messageRepository
            .createQueryBuilder('message')
            .innerJoin('conversations', 'conversation', 'conversation.id = message.conversationId')
            .where('conversation.supplierId = :supplierId', { supplierId })
            .andWhere('message.senderId != :supplierId', { supplierId })
            .andWhere('message.createdAt > :date', {
              date: new Date(Date.now() - 24 * 60 * 60 * 1000),
            })
            .andWhere('message.isRead = false')
            .getCount(),

          // Total portfolios - simple count with indexed field
          this.portfolioRepository.count({
            where: { supplierId },
          }),

          // Total reviews - simple count with indexed field
          this.reviewRepository.count({
            where: { supplierId },
          }),

          // Average rating - use raw query for better performance
          this.ratingRepository
            .createQueryBuilder('rating')
            .select('AVG(rating.totalScore)', 'avg')
            .where('rating.supplierId = :supplierId', { supplierId })
            .getRawOne(),
        ]);

        return {
          newRequests,
          activeProjects,
          newMessages,
          totalPortfolios,
          totalReviews,
          averageRating: averageRating?.avg ? parseFloat(averageRating.avg) : 0,
        };
      },
      this.CACHE_TTL,
    );
  }
}


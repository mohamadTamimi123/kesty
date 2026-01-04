import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThanOrEqual } from 'typeorm';
import { randomBytes } from 'crypto';
import { Review } from './entities/review.entity';
import { ReviewRequest, ReviewRequestStatus } from './entities/review-request.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { CreateReviewRequestDto } from './dto/create-review-request.dto';
import { Portfolio } from '../portfolio/entities/portfolio.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(ReviewRequest)
    private reviewRequestRepository: Repository<ReviewRequest>,
    @InjectRepository(Portfolio)
    private portfolioRepository: Repository<Portfolio>,
  ) {}

  async create(createReviewDto: CreateReviewDto, customer: User): Promise<Review> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { id: createReviewDto.portfolioId },
      relations: ['supplier'],
    });

    if (!portfolio) {
      throw new NotFoundException('Portfolio not found');
    }

    // Check if customer already reviewed this portfolio
    const existingReview = await this.reviewRepository.findOne({
      where: {
        portfolioId: createReviewDto.portfolioId,
        customerId: customer.id,
      },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this portfolio');
    }

    const review = this.reviewRepository.create({
      ...createReviewDto,
      customerId: customer.id,
      supplierId: portfolio.supplierId,
    });

    // Auto-approve reviews (moderation mode)
    review.isApproved = true;

    return this.reviewRepository.save(review);
  }

  async approve(id: string): Promise<Review> {
    const review = await this.reviewRepository.findOne({ where: { id } });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    review.isApproved = true;
    return this.reviewRepository.save(review);
  }

  async reject(id: string): Promise<Review> {
    const review = await this.reviewRepository.findOne({ where: { id } });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    review.isDeleted = true;
    return this.reviewRepository.save(review);
  }

  async findBySupplier(supplierId: string): Promise<Review[]> {
    return this.reviewRepository.find({
      where: {
        supplierId,
        isApproved: true,
        isDeleted: false,
      },
      relations: ['customer', 'portfolio'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByPortfolio(portfolioId: string): Promise<Review[]> {
    return this.reviewRepository.find({
      where: {
        portfolioId,
        isApproved: true,
        isDeleted: false,
      },
      relations: ['customer'],
      order: { createdAt: 'DESC' },
    });
  }

  async calculateReviewScore(supplierId: string): Promise<number> {
    const reviews = await this.reviewRepository.find({
      where: {
        supplierId,
        isApproved: true,
        isDeleted: false,
      },
    });

    if (reviews.length === 0) {
      return 0;
    }

    // Calculate average rating (70% weight)
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    const avgRatingScore = (avgRating / 5) * 17.5; // Max 17.5 points (70% of 25)

    // Number of reviews (30% weight)
    const reviewCountScore = Math.min(reviews.length * 0.75, 7.5); // Max 7.5 points (30% of 25)

    return Math.round((avgRatingScore + reviewCountScore) * 100) / 100;
  }

  /**
   * Generate a unique token for one-time review request
   */
  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  async createReviewRequest(
    createRequestDto: CreateReviewRequestDto,
    supplier: User,
  ): Promise<ReviewRequest> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { id: createRequestDto.portfolioId },
      relations: ['supplier', 'customer'],
    });

    if (!portfolio) {
      throw new NotFoundException('Portfolio not found');
    }

    if (portfolio.supplierId !== supplier.id) {
      throw new ForbiddenException('You can only request reviews for your own portfolios');
    }

    // If generating token (for non-Keesti customers)
    if (createRequestDto.generateToken === true) {
      if (!createRequestDto.customerName || createRequestDto.customerName.trim() === '') {
        throw new BadRequestException('Customer name is required for token-based requests');
      }

      // For token-based requests, customerId should not be provided
      if (createRequestDto.customerId) {
        throw new BadRequestException('Customer ID should not be provided when generating token');
      }

      // Generate unique token
      let token: string = '';
      let isUnique = false;
      while (!isUnique) {
        token = this.generateToken();
        const existing = await this.reviewRequestRepository.findOne({
          where: { token },
        });
        if (!existing) {
          isUnique = true;
        }
      }

      const request = this.reviewRequestRepository.create({
        portfolioId: createRequestDto.portfolioId,
        supplierId: supplier.id,
        customerId: null,
        customerName: createRequestDto.customerName,
        customerEmail: createRequestDto.customerEmail || null,
        token,
        message: createRequestDto.message || null,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days for token-based requests
        status: ReviewRequestStatus.PENDING,
      });

      return this.reviewRequestRepository.save(request);
    }

    // Regular request with customerId (for Keesti customers)
    if (!createRequestDto.customerId) {
      throw new BadRequestException('Customer ID is required for regular requests');
    }

    if (portfolio.customerId && portfolio.customerId !== createRequestDto.customerId) {
      throw new BadRequestException('Customer ID does not match portfolio customer');
    }

    // Check if request already exists
    const existingRequest = await this.reviewRequestRepository.findOne({
      where: {
        portfolioId: createRequestDto.portfolioId,
        customerId: createRequestDto.customerId,
        status: ReviewRequestStatus.PENDING,
      },
    });

    if (existingRequest) {
      throw new BadRequestException('Review request already exists');
    }

    const request = this.reviewRequestRepository.create({
      portfolioId: createRequestDto.portfolioId,
      supplierId: supplier.id,
      customerId: createRequestDto.customerId,
      customerName: null,
      customerEmail: null,
      token: null,
      message: createRequestDto.message || null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      status: ReviewRequestStatus.PENDING,
    });

    return this.reviewRequestRepository.save(request);
  }

  /**
   * Get review request by token (for non-Keesti customers)
   */
  async getReviewRequestByToken(token: string): Promise<ReviewRequest> {
    const request = await this.reviewRequestRepository.findOne({
      where: { token },
      relations: ['portfolio', 'supplier', 'portfolio.images'],
    });

    if (!request) {
      throw new NotFoundException('Review request not found');
    }

    if (request.status !== ReviewRequestStatus.PENDING) {
      throw new BadRequestException('This review request is no longer valid');
    }

    if (request.expiresAt && request.expiresAt < new Date()) {
      request.status = ReviewRequestStatus.EXPIRED;
      await this.reviewRequestRepository.save(request);
      throw new BadRequestException('This review request has expired');
    }

    return request;
  }

  /**
   * Create review using token (for non-Keesti customers)
   */
  async createReviewWithToken(
    token: string,
    createReviewDto: CreateReviewDto & { customerName: string; customerEmail?: string },
  ): Promise<Review> {
    const request = await this.getReviewRequestByToken(token);

    // Check if review already exists for this token (by token or by customerId if exists)
    const existingReview = await this.reviewRepository.findOne({
      where: request.customerId
        ? {
            portfolioId: request.portfolioId,
            customerId: request.customerId,
          }
        : {
            portfolioId: request.portfolioId,
            customerName: createReviewDto.customerName,
          },
    });

    if (existingReview) {
      throw new BadRequestException('Review already exists for this request');
    }

    const reviewData: Partial<Review> = {
      portfolioId: request.portfolioId,
      rating: createReviewDto.rating,
      comment: createReviewDto.comment || null,
      customerId: request.customerId || null, // Can be null for token-based reviews
      customerName: createReviewDto.customerName || null,
      customerEmail: createReviewDto.customerEmail || null,
      supplierId: request.supplierId,
      isApproved: true,
    };

    const review = this.reviewRepository.create(reviewData);

    const savedReview = await this.reviewRepository.save(review);

    // Mark request as accepted and invalidate token
    request.status = ReviewRequestStatus.ACCEPTED;
    request.token = null; // Invalidate token after use
    await this.reviewRequestRepository.save(request);

    return savedReview;
  }

  async getPendingRequests(customerId: string): Promise<ReviewRequest[]> {
    return this.reviewRequestRepository.find({
      where: {
        customerId,
        status: ReviewRequestStatus.PENDING,
        expiresAt: MoreThan(new Date()),
      },
      relations: ['portfolio', 'supplier'],
      order: { createdAt: 'DESC' },
    });
  }

  async getReviewRequestById(requestId: string, customerId: string): Promise<ReviewRequest> {
    const request = await this.reviewRequestRepository.findOne({
      where: { id: requestId },
      relations: ['portfolio', 'supplier', 'portfolio.images'],
    });

    if (!request) {
      throw new NotFoundException('Review request not found');
    }

    // Allow access if customerId matches OR if it's a token-based request (customerId is null)
    if (request.customerId && request.customerId !== customerId) {
      throw new ForbiddenException('You can only view your own review requests');
    }

    return request;
  }

  async acceptRequest(requestId: string, customer: User): Promise<void> {
    const request = await this.reviewRequestRepository.findOne({
      where: { id: requestId },
      relations: ['customer'],
    });

    if (!request) {
      throw new NotFoundException('Review request not found');
    }

    if (request.customerId !== customer.id) {
      throw new ForbiddenException('You can only accept your own review requests');
    }

    request.status = ReviewRequestStatus.ACCEPTED;
    await this.reviewRequestRepository.save(request);
  }

  async rejectRequest(requestId: string, customer: User): Promise<void> {
    const request = await this.reviewRequestRepository.findOne({
      where: { id: requestId },
      relations: ['customer'],
    });

    if (!request) {
      throw new NotFoundException('Review request not found');
    }

    if (request.customerId !== customer.id) {
      throw new ForbiddenException('You can only reject your own review requests');
    }

    request.status = ReviewRequestStatus.REJECTED;
    await this.reviewRequestRepository.save(request);
  }

  async getSupplierReviewRequests(
    supplierId: string,
    status?: ReviewRequestStatus,
  ): Promise<ReviewRequest[]> {
    try {
      this.logger.debug(`Fetching review requests for supplier: ${supplierId}, status: ${status || 'all'}`);
      
      // First, update expired requests
      const now = new Date();
      const expiredRequests = await this.reviewRequestRepository.find({
        where: {
          supplierId,
          status: ReviewRequestStatus.PENDING,
          expiresAt: LessThanOrEqual(now),
        },
      });

      if (expiredRequests.length > 0) {
        this.logger.debug(`Updating ${expiredRequests.length} expired requests`);
        for (const req of expiredRequests) {
          req.status = ReviewRequestStatus.EXPIRED;
          await this.reviewRequestRepository.save(req);
        }
      }

      // Build where condition
      const where: any = { supplierId };
      if (status) {
        where.status = status;
      }

      // Try using find with relations first (simpler approach)
      // If this fails, we'll catch and try query builder
      try {
        const requests = await this.reviewRequestRepository.find({
          where,
          relations: ['portfolio', 'customer'],
          order: { createdAt: 'DESC' },
        });
        
        this.logger.debug(`Found ${requests.length} review requests`);
        return requests;
      } catch (relationError) {
        // If relations fail, try query builder with left join
        this.logger.warn('Relations failed, trying query builder:', relationError);
        
        try {
          const queryBuilder = this.reviewRequestRepository
            .createQueryBuilder('request')
            .leftJoinAndSelect('request.portfolio', 'portfolio')
            .leftJoinAndSelect('request.customer', 'customer')
            .where('request.supplierId = :supplierId', { supplierId });

          if (status) {
            queryBuilder.andWhere('request.status = :status', { status });
          }

          queryBuilder.orderBy('request.createdAt', 'DESC');

          const requests = await queryBuilder.getMany();
          this.logger.debug(`Found ${requests.length} review requests using query builder`);
          return requests;
        } catch (queryBuilderError) {
          // If query builder also fails, return without relations as last resort
          this.logger.error('Query builder also failed, returning without relations:', queryBuilderError);
          
          const requests = await this.reviewRequestRepository.find({
            where,
            order: { createdAt: 'DESC' },
          });
          
          this.logger.debug(`Found ${requests.length} review requests without relations`);
          return requests;
        }
      }
    } catch (error) {
      // Log the error with full details for debugging
      this.logger.error('Error in getSupplierReviewRequests:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        supplierId,
        status,
        errorType: error?.constructor?.name,
      });
      
      // Re-throw to be caught by exception filter
      throw error;
    }
  }

  async getSupplierPendingRequests(supplierId: string): Promise<ReviewRequest[]> {
    const now = new Date();
    return this.reviewRequestRepository.find({
      where: {
        supplierId,
        status: ReviewRequestStatus.PENDING,
        expiresAt: MoreThan(now),
      },
      relations: ['portfolio', 'customer'],
      order: { createdAt: 'DESC' },
    });
  }

  async cancelReviewRequest(requestId: string, supplierId: string): Promise<void> {
    const request = await this.reviewRequestRepository.findOne({
      where: { id: requestId },
      relations: ['supplier'],
    });

    if (!request) {
      throw new NotFoundException('Review request not found');
    }

    if (request.supplierId !== supplierId) {
      throw new ForbiddenException('You can only cancel your own review requests');
    }

    if (request.status !== ReviewRequestStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be cancelled');
    }

    await this.reviewRequestRepository.remove(request);
  }
}


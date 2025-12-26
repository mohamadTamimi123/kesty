import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Review } from './entities/review.entity';
import { ReviewRequest, ReviewRequestStatus } from './entities/review-request.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { CreateReviewRequestDto } from './dto/create-review-request.dto';
import { Portfolio } from '../portfolio/entities/portfolio.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ReviewsService {
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

    if (portfolio.customerId !== createRequestDto.customerId) {
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
      ...createRequestDto,
      supplierId: supplier.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return this.reviewRequestRepository.save(request);
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
}


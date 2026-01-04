import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { SupplierRating } from './entities/supplier-rating.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Review } from '../reviews/entities/review.entity';
import { Portfolio } from '../portfolio/entities/portfolio.entity';
import { MachineSupplier } from '../machines/entities/machine-supplier.entity';

@Injectable()
export class RatingService {
  constructor(
    @InjectRepository(SupplierRating)
    private ratingRepository: Repository<SupplierRating>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(Portfolio)
    private portfolioRepository: Repository<Portfolio>,
    @InjectRepository(MachineSupplier)
    private machineSupplierRepository: Repository<MachineSupplier>,
  ) {}

  async getPremiumScore(supplier: User): Promise<number> {
    if (!supplier.isPremium || !supplier.premiumLevel) {
      return 0;
    }

    const level = supplier.premiumLevel.toUpperCase();
    switch (level) {
      case 'GOLD':
        return 30;
      case 'SILVER':
        return 24;
      case 'BRONZE':
        return 18;
      default:
        return 0;
    }
  }

  async getReviewScore(supplierId: string): Promise<number> {
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

    // Average rating (70% of 25 = 17.5 points)
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    const avgRatingScore = (avgRating / 5) * 17.5;

    // Number of reviews (30% of 25 = 7.5 points)
    const reviewCountScore = Math.min(reviews.length * 0.75, 7.5);

    return Math.round((avgRatingScore + reviewCountScore) * 100) / 100;
  }

  async getProfileScore(supplier: User): Promise<number> {
    let score = 0;

    // Basic info (25% of 20 = 5 points)
    if (supplier.workshopName) score += 2.5;
    if (supplier.workshopAddress) score += 2.5;

    // Profile images (15% of 20 = 3 points)
    if (supplier.profileImageUrl) score += 1.5;
    if (supplier.coverImageUrl) score += 1.5;

    // Machine list (12% of 20 = 2.4 points)
    const machineCount = await this.machineSupplierRepository.count({
      where: { supplierId: supplier.id },
    });
    if (machineCount >= 5) {
      score += 2.4;
    } else {
      score += (machineCount * 2.4) / 5;
    }

    // Materials (8% of 20 = 1.6 points)
    // Note: MaterialSupplier entity may not exist yet, so we'll skip this for now
    // When MaterialSupplier is implemented, uncomment the following:
    // const materialCount = await this.materialSupplierRepository.count({
    //   where: { supplierId: supplier.id },
    // });
    // if (materialCount >= 3) {
    //   score += 1.6;
    // } else {
    //   score += (materialCount * 1.6) / 3;
    // }
    score += 0; // Placeholder until MaterialSupplier is implemented

    // Gallery (40% of 20 = 8 points)
    const portfolios = await this.portfolioRepository.find({
      where: { supplierId: supplier.id },
      relations: ['images'],
    });

    const totalImages = portfolios.reduce(
      (sum, p) => sum + (p.images?.length || 0),
      0,
    );

    if (totalImages >= 3) {
      score += 8;
    } else {
      score += (totalImages * 8) / 3;
    }

    return Math.round(score * 100) / 100;
  }

  async getResponseScore(supplierId: string): Promise<number> {
    const reviews = await this.reviewRepository.find({
      where: {
        supplierId,
        isApproved: true,
        isDeleted: false,
        responseTimeHours: LessThan(12),
      },
    });

    if (reviews.length === 0) {
      return 0;
    }

    // Calculate average response time
    const avgResponseTime = reviews.reduce(
      (sum, r) => sum + (r.responseTimeHours || 12),
      0,
    ) / reviews.length;

    if (avgResponseTime < 2) {
      return 15;
    } else if (avgResponseTime < 12) {
      return 10;
    } else {
      return 5;
    }
  }

  async getActivityScore(supplierId: string): Promise<number> {
    const supplier = await this.userRepository.findOne({
      where: { id: supplierId },
    });

    if (!supplier) {
      return 0;
    }

    let activityScore = 0;

    // Check for recent reviews (30% of 10 = 3 points)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const recentReviews = await this.reviewRepository.count({
      where: {
        supplierId,
        createdAt: LessThan(new Date()),
      },
    });

    if (recentReviews > 0) {
      activityScore += 3;
    }

    // Check last login activity (70% of 10 = 7 points)
    if (supplier.lastLoginAt) {
      const daysSinceLogin = Math.floor(
        (Date.now() - new Date(supplier.lastLoginAt).getTime()) / (1000 * 60 * 60 * 24),
      );
      
      if (daysSinceLogin <= 7) {
        activityScore += 7; // Very active
      } else if (daysSinceLogin <= 30) {
        activityScore += 5; // Active
      } else if (daysSinceLogin <= 90) {
        activityScore += 3; // Somewhat active
      } else {
        activityScore += 1; // Inactive
      }
    } else {
      // No login recorded, assume inactive
      activityScore += 1;
    }

    return Math.min(activityScore, 10);
  }

  async calculatePenalties(supplierId: string): Promise<number> {
    let penalties = 0;

    // Check average rating below 2 stars
    const reviews = await this.reviewRepository.find({
      where: {
        supplierId,
        isApproved: true,
        isDeleted: false,
      },
    });

    if (reviews.length > 0) {
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      if (avgRating < 2) {
        penalties += 30;
      }
    }

    // Check response rate below 50%
    const totalRequests = reviews.length;
    const respondedRequests = reviews.filter((r) => r.responseTimeHours !== null).length;
    const responseRate = totalRequests > 0 ? respondedRequests / totalRequests : 1;

    if (responseRate < 0.5) {
      penalties += 20;
    }

    // Check inactivity (90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const recentActivity = await this.reviewRepository.findOne({
      where: {
        supplierId,
        createdAt: LessThan(new Date()),
      },
      order: { createdAt: 'DESC' },
    });

    if (!recentActivity || recentActivity.createdAt < ninetyDaysAgo) {
      penalties += 40;
    }

    // Check for reported violations (should be implemented separately)
    // penalties += 50; // If violation confirmed

    return penalties;
  }

  async calculateTotalScore(supplierId: string): Promise<SupplierRating> {
    const supplier = await this.userRepository.findOne({
      where: { id: supplierId, role: UserRole.SUPPLIER },
    });

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    const premiumScore = await this.getPremiumScore(supplier);
    const reviewScore = await this.getReviewScore(supplierId);
    const profileScore = await this.getProfileScore(supplier);
    const responseScore = await this.getResponseScore(supplierId);
    const activityScore = await this.getActivityScore(supplierId);
    const penalties = await this.calculatePenalties(supplierId);

    const totalScore = Math.max(
      0,
      premiumScore + reviewScore + profileScore + responseScore + activityScore - penalties,
    );

    // Try to find existing rating first
    let rating = await this.ratingRepository.findOne({
      where: { supplierId },
    });

    if (rating) {
      // Update existing rating
      rating.premiumScore = premiumScore;
      rating.reviewScore = reviewScore;
      rating.profileScore = profileScore;
      rating.responseScore = responseScore;
      rating.activityScore = activityScore;
      rating.penalties = penalties;
      rating.totalScore = totalScore;
      rating.lastCalculatedAt = new Date();

      return this.ratingRepository.save(rating);
    }

    // Create new rating, handle duplicate key error
    try {
      rating = this.ratingRepository.create({
        supplierId,
        premiumScore,
        reviewScore,
        profileScore,
        responseScore,
        activityScore,
        penalties,
        totalScore,
        lastCalculatedAt: new Date(),
      });

      return await this.ratingRepository.save(rating);
    } catch (error: any) {
      // If duplicate key error (race condition), fetch and update existing
      if (error.code === '23505' || error.message?.includes('duplicate key')) {
        rating = await this.ratingRepository.findOne({
          where: { supplierId },
        });

        if (rating) {
          rating.premiumScore = premiumScore;
          rating.reviewScore = reviewScore;
          rating.profileScore = profileScore;
          rating.responseScore = responseScore;
          rating.activityScore = activityScore;
          rating.penalties = penalties;
          rating.totalScore = totalScore;
          rating.lastCalculatedAt = new Date();

          return this.ratingRepository.save(rating);
        }
      }

      // Re-throw if it's not a duplicate key error
      throw error;
    }
  }

  async updateSupplierRating(supplierId: string): Promise<SupplierRating> {
    return this.calculateTotalScore(supplierId);
  }

  async getSupplierRating(supplierId: string): Promise<SupplierRating> {
    let rating = await this.ratingRepository.findOne({
      where: { supplierId },
      relations: ['supplier'],
    });

    if (!rating) {
      rating = await this.calculateTotalScore(supplierId);
    }

    return rating;
  }

  async recalculateAll(): Promise<void> {
    const suppliers = await this.userRepository.find({
      where: { role: UserRole.SUPPLIER },
    });

    for (const supplier of suppliers) {
      await this.calculateTotalScore(supplier.id);
    }
  }
}


import {
  Controller,
  Get,
  Param,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CategoriesService } from '../categories/categories.service';
import { Portfolio } from '../portfolio/entities/portfolio.entity';
import { Review } from '../reviews/entities/review.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from './entities/user.entity';

@Controller('suppliers')
export class SuppliersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly categoriesService: CategoriesService,
    @InjectRepository(Portfolio)
    private portfolioRepository: Repository<Portfolio>,
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
  ) {}

  @Get(':slug')
  @HttpCode(HttpStatus.OK)
  async getSupplierBySlug(@Param('slug') slug: string) {
    const supplier = await this.usersService.findSupplierBySlug(slug);
    
    if (!supplier) {
      throw new NotFoundException('تولیدکننده یافت نشد');
    }

    // Get related data
    const [categories, portfolios, reviews] = await Promise.all([
      this.categoriesService.getCategoriesForSupplier(supplier.id),
      this.portfolioRepository.find({
        where: { supplierId: supplier.id, isPublic: true },
        order: { createdAt: 'DESC' },
        take: 10,
      }),
      this.reviewRepository.find({
        where: { supplierId: supplier.id },
        relations: ['customer'],
        order: { createdAt: 'DESC' },
        take: 10,
      }),
    ]);

    return {
      ...supplier,
      categories,
      portfolios,
      reviews,
    };
  }
}


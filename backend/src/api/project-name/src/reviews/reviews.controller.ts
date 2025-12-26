import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { CreateReviewRequestDto } from './dto/create-review-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createReviewDto: CreateReviewDto, @CurrentUser() customer: User) {
    return this.reviewsService.create(createReviewDto, customer);
  }

  @Get('my-reviews')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  async getMyReviews(@CurrentUser() customer: User) {
    // This should return reviews created by the customer
    // For now, return pending review requests
    return this.reviewsService.getPendingRequests(customer.id);
  }

  @Get('my-supplier-reviews')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPPLIER)
  async getSupplierReviews(@CurrentUser() supplier: User) {
    return this.reviewsService.findBySupplier(supplier.id);
  }

  @Get('pending-requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPPLIER)
  async getPendingRequests(@CurrentUser() supplier: User) {
    // This should return review requests for supplier's portfolios
    // For now, return empty array
    return [];
  }

  @Get('portfolio/:portfolioId')
  async getPortfolioReviews(@Param('portfolioId') portfolioId: string) {
    return this.reviewsService.findByPortfolio(portfolioId);
  }

  @Post('request')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPPLIER)
  @HttpCode(HttpStatus.CREATED)
  async createReviewRequest(
    @Body() createRequestDto: CreateReviewRequestDto,
    @CurrentUser() supplier: User,
  ) {
    return this.reviewsService.createReviewRequest(createRequestDto, supplier);
  }

  @Post('request/:requestId/accept')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  async acceptRequest(@Param('requestId') requestId: string, @CurrentUser() customer: User) {
    await this.reviewsService.acceptRequest(requestId, customer);
    return { message: 'Review request accepted' };
  }

  @Post('request/:requestId/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  async rejectRequest(@Param('requestId') requestId: string, @CurrentUser() customer: User) {
    await this.reviewsService.rejectRequest(requestId, customer);
    return { message: 'Review request rejected' };
  }
}


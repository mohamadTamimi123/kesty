import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { CreateReviewRequestDto } from './dto/create-review-request.dto';
import { ReviewRequestStatus } from './entities/review-request.entity';
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

  @Get('request/:requestId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  async getReviewRequest(@Param('requestId') requestId: string, @CurrentUser() customer: User) {
    return this.reviewsService.getReviewRequestById(requestId, customer.id);
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
    return this.reviewsService.getSupplierPendingRequests(supplier.id);
  }

  @Get('requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPPLIER)
  async getRequests(
    @CurrentUser() supplier: User,
    @Query('status') status?: ReviewRequestStatus,
  ) {
    return this.reviewsService.getSupplierReviewRequests(supplier.id, status);
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

  @Delete('request/:requestId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPPLIER)
  @HttpCode(HttpStatus.OK)
  async cancelRequest(@Param('requestId') requestId: string, @CurrentUser() supplier: User) {
    await this.reviewsService.cancelReviewRequest(requestId, supplier.id);
    return { message: 'Review request cancelled' };
  }

  // Token-based endpoints (for non-Keesti customers)
  @Get('token/:token')
  @HttpCode(HttpStatus.OK)
  async getReviewRequestByToken(@Param('token') token: string) {
    return this.reviewsService.getReviewRequestByToken(token);
  }

  @Post('token/:token')
  @HttpCode(HttpStatus.CREATED)
  async createReviewWithToken(
    @Param('token') token: string,
    @Body() createReviewDto: CreateReviewDto & { customerName: string; customerEmail?: string },
  ) {
    return this.reviewsService.createReviewWithToken(token, createReviewDto);
  }
}


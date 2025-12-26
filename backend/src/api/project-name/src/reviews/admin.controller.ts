import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('admin/reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ReviewsAdminController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('pending')
  async getPendingReviews() {
    // This should return reviews pending approval
    // For now, return empty array as reviews are auto-approved
    return [];
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  async approveReview(@Param('id') id: string) {
    return this.reviewsService.approve(id);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  async rejectReview(@Param('id') id: string) {
    return this.reviewsService.reject(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteReview(@Param('id') id: string) {
    await this.reviewsService.reject(id);
  }
}


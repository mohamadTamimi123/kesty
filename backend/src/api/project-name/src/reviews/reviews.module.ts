import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { ReviewsAdminController } from './admin.controller';
import { Review } from './entities/review.entity';
import { ReviewRequest } from './entities/review-request.entity';
import { Portfolio } from '../portfolio/entities/portfolio.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Review, ReviewRequest, Portfolio])],
  controllers: [ReviewsController, ReviewsAdminController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}


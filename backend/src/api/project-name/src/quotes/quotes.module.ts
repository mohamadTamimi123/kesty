import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuotesController } from './quotes.controller';
import { SupplierController } from './supplier.controller';
import { QuotesService } from './quotes.service';
import { QuoteRankingService } from './quote-ranking.service';
import { SupplierStatsService } from '../common/services/supplier-stats.service';
import { Quote } from './entities/quote.entity';
import { Project } from '../projects/entities/project.entity';
import { Message } from '../messaging/entities/message.entity';
import { Portfolio } from '../portfolio/entities/portfolio.entity';
import { Review } from '../reviews/entities/review.entity';
import { SupplierRating } from '../rating/entities/supplier-rating.entity';
import { RatingModule } from '../rating/rating.module';
import { MessagingModule } from '../messaging/messaging.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Quote, Project, Message, Portfolio, Review, SupplierRating]),
    forwardRef(() => RatingModule),
    forwardRef(() => MessagingModule),
  ],
  controllers: [QuotesController, SupplierController],
  providers: [QuotesService, QuoteRankingService, SupplierStatsService],
  exports: [QuotesService, QuoteRankingService],
})
export class QuotesModule {}


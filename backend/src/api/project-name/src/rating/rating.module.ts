import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RatingService } from './rating.service';
import { RatingController } from './rating.controller';
import { SupplierRating } from './entities/supplier-rating.entity';
import { User } from '../users/entities/user.entity';
import { Review } from '../reviews/entities/review.entity';
import { Portfolio } from '../portfolio/entities/portfolio.entity';
import { MachineSupplier } from '../machines/entities/machine-supplier.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SupplierRating, User, Review, Portfolio, MachineSupplier])],
  controllers: [RatingController],
  providers: [RatingService],
  exports: [RatingService],
})
export class RatingModule {}


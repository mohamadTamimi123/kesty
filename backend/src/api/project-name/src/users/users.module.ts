import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { AdminUsersController } from './admin.controller';
import { SuppliersController } from './users.controller';
import { CategoriesModule } from '../categories/categories.module';
import { Portfolio } from '../portfolio/entities/portfolio.entity';
import { Review } from '../reviews/entities/review.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Portfolio, Review]),
    CategoriesModule,
  ],
  controllers: [AdminUsersController, SuppliersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}


import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';
import { CategorySupplier } from './entities/category-supplier.entity';
import { User } from '../users/entities/user.entity';
import { SupplierRating } from '../rating/entities/supplier-rating.entity';
import { CitySupplier } from '../cities/entities/city-supplier.entity';
import { City } from '../cities/entities/city.entity';
import { EducationalArticle } from '../educational-articles/entities/educational-article.entity';
import { AdminCategoriesController } from './admin.controller';
import { CategoriesController } from './categories.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Category,
      CategorySupplier,
      User,
      SupplierRating,
      CitySupplier,
      City,
      EducationalArticle,
    ]),
  ],
  controllers: [AdminCategoriesController, CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}


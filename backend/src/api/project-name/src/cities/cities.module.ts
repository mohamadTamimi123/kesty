import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CitiesService } from './cities.service';
import { City } from './entities/city.entity';
import { CitySupplier } from './entities/city-supplier.entity';
import { User } from '../users/entities/user.entity';
import { Project } from '../projects/entities/project.entity';
import { SupplierRating } from '../rating/entities/supplier-rating.entity';
import { CategorySupplier } from '../categories/entities/category-supplier.entity';
import { Category } from '../categories/entities/category.entity';
import { AdminCitiesController } from './admin.controller';
import { CitiesController } from './cities.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      City,
      CitySupplier,
      User,
      Project,
      SupplierRating,
      CategorySupplier,
      Category,
    ]),
  ],
  controllers: [AdminCitiesController, CitiesController],
  providers: [CitiesService],
  exports: [CitiesService],
})
export class CitiesModule {}


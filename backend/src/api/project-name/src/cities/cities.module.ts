import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CitiesService } from './cities.service';
import { City } from './entities/city.entity';
import { CitySupplier } from './entities/city-supplier.entity';
import { AdminCitiesController } from './admin.controller';
import { CitiesController } from './cities.controller';

@Module({
  imports: [TypeOrmModule.forFeature([City, CitySupplier])],
  controllers: [AdminCitiesController, CitiesController],
  providers: [CitiesService],
  exports: [CitiesService],
})
export class CitiesModule {}


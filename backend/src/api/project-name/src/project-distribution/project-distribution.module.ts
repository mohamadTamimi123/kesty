import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectDistributionService } from './project-distribution.service';
import { ProjectDistributionController } from './project-distribution.controller';
import { Project } from '../projects/entities/project.entity';
import { CategorySupplier } from '../categories/entities/category-supplier.entity';
import { CitySupplier } from '../cities/entities/city-supplier.entity';
import { User } from '../users/entities/user.entity';
import { MessagingModule } from '../messaging/messaging.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, CategorySupplier, CitySupplier, User]),
    MessagingModule,
  ],
  controllers: [ProjectDistributionController],
  providers: [ProjectDistributionService],
  exports: [ProjectDistributionService],
})
export class ProjectDistributionModule {}


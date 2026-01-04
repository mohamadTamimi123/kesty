import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProjectDistributionService } from './project-distribution.service';
import { ProjectDistributionController } from './project-distribution.controller';
import { ProjectDistributionProcessor } from './project-distribution.processor';
import { Project } from '../projects/entities/project.entity';
import { CategorySupplier } from '../categories/entities/category-supplier.entity';
import { CitySupplier } from '../cities/entities/city-supplier.entity';
import { User } from '../users/entities/user.entity';
import { MessagingModule } from '../messaging/messaging.module';
import { RatingModule } from '../rating/rating.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, CategorySupplier, CitySupplier, User]),
    MessagingModule,
    RatingModule,
    BullModule.registerQueueAsync({
      name: 'project-distribution',
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const password = configService.get<string>('REDIS_PASSWORD', 'redis_password');
        const redisConfig: any = {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        };
        
        // Add password if provided (even if it's the default)
        if (password && password.trim() !== '') {
          redisConfig.password = password;
        }
        
        return {
          redis: redisConfig,
          defaultJobOptions: {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000,
            },
            removeOnComplete: {
              age: 24 * 3600, // Keep completed jobs for 24 hours
              count: 1000, // Keep last 1000 completed jobs
            },
            removeOnFail: {
              age: 7 * 24 * 3600, // Keep failed jobs for 7 days
            },
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [ProjectDistributionController],
  providers: [ProjectDistributionService, ProjectDistributionProcessor],
  exports: [ProjectDistributionService, BullModule],
})
export class ProjectDistributionModule {}


import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CitiesModule } from './cities/cities.module';
import { CategoriesModule } from './categories/categories.module';
import { ProjectsModule } from './projects/projects.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { ReviewsModule } from './reviews/reviews.module';
import { RatingModule } from './rating/rating.module';
import { MachinesModule } from './machines/machines.module';
import { MaterialsModule } from './materials/materials.module';
import { ChangelogModule } from './changelog/changelog.module';
import { EducationalArticlesModule } from './educational-articles/educational-articles.module';
import { MachineListingsModule } from './machine-listings/machine-listings.module';
import { MessagingModule } from './messaging/messaging.module';
import { RedisModule } from './common/modules/redis.module';
import { getDatabaseConfig } from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),
    RedisModule,
    AuthModule,
    UsersModule,
    CitiesModule,
    CategoriesModule,
    ProjectsModule,
    PortfolioModule,
    ReviewsModule,
    RatingModule,
    MachinesModule,
    MaterialsModule,
    ChangelogModule,
    EducationalArticlesModule,
    MachineListingsModule,
    MessagingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  constructor(private dataSource: DataSource) {}

  async onModuleInit() {
    try {
      // Try to install uuid-ossp extension, if it fails, use gen_random_uuid() instead
      await this.dataSource.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      console.log('uuid-ossp extension installed successfully');
    } catch (error) {
      console.warn('Could not install uuid-ossp extension, will use gen_random_uuid() instead:', error.message);
      // If extension installation fails, we'll need to modify the default values
      // TypeORM will use gen_random_uuid() if uuid-ossp is not available
    }
  }
}

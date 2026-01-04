import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { EducationalArticlesService } from './educational-articles.service';
import { EducationalArticlesController } from './educational-articles.controller';
import { EducationalArticle } from './entities/educational-article.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([EducationalArticle]),
    ConfigModule,
  ],
  controllers: [EducationalArticlesController],
  providers: [EducationalArticlesService],
  exports: [EducationalArticlesService],
})
export class EducationalArticlesModule {}


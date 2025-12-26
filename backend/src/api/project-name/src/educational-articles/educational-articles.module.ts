import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EducationalArticlesService } from './educational-articles.service';
import { EducationalArticlesController } from './educational-articles.controller';
import { EducationalArticle } from './entities/educational-article.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EducationalArticle])],
  controllers: [EducationalArticlesController],
  providers: [EducationalArticlesService],
  exports: [EducationalArticlesService],
})
export class EducationalArticlesModule {}


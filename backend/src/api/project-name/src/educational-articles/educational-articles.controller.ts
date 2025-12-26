import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { EducationalArticlesService } from './educational-articles.service';
import { CreateEducationalArticleDto } from './dto/create-educational-article.dto';
import { UpdateEducationalArticleDto } from './dto/update-educational-article.dto';

@Controller('educational-articles')
export class EducationalArticlesController {
  constructor(
    private readonly educationalArticlesService: EducationalArticlesService,
  ) {}

  @Post()
  create(@Body() createDto: CreateEducationalArticleDto) {
    return this.educationalArticlesService.create(createDto);
  }

  @Get()
  findAll(@Query('published') published?: string) {
    const isPublished = published === 'true' ? true : published === 'false' ? false : undefined;
    return this.educationalArticlesService.findAll(isPublished);
  }

  @Get('popular')
  getPopular(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.educationalArticlesService.getPopular(limitNum);
  }

  @Get('category/:categoryId')
  findByCategory(@Param('categoryId') categoryId: string) {
    return this.educationalArticlesService.findByCategory(categoryId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.educationalArticlesService.findOne(id);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.educationalArticlesService.findBySlug(slug);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateEducationalArticleDto) {
    return this.educationalArticlesService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.educationalArticlesService.remove(id);
  }
}


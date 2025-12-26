import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EducationalArticle } from './entities/educational-article.entity';
import { CreateEducationalArticleDto } from './dto/create-educational-article.dto';
import { UpdateEducationalArticleDto } from './dto/update-educational-article.dto';

@Injectable()
export class EducationalArticlesService {
  constructor(
    @InjectRepository(EducationalArticle)
    private articlesRepository: Repository<EducationalArticle>,
  ) {}

  async findAll(published?: boolean): Promise<EducationalArticle[]> {
    const query = this.articlesRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.category', 'category')
      .leftJoinAndSelect('article.subCategory', 'subCategory')
      .leftJoinAndSelect('article.author', 'author');

    if (published !== undefined) {
      query.where('article.isPublished = :published', { published });
    }

    return query.orderBy('article.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<EducationalArticle> {
    const article = await this.articlesRepository.findOne({
      where: { id },
      relations: ['category', 'subCategory', 'author'],
    });
    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found`);
    }
    return article;
  }

  async findBySlug(slug: string): Promise<EducationalArticle> {
    const article = await this.articlesRepository.findOne({
      where: { slug },
      relations: ['category', 'subCategory', 'author'],
    });
    if (!article) {
      throw new NotFoundException(`Article with slug ${slug} not found`);
    }
    // Increment view count
    article.viewCount += 1;
    await this.articlesRepository.save(article);
    return article;
  }

  async findByCategory(categoryId: string): Promise<EducationalArticle[]> {
    return this.articlesRepository.find({
      where: [
        { categoryId, isPublished: true },
        { subCategoryId: categoryId, isPublished: true },
      ],
      relations: ['category', 'subCategory', 'author'],
      order: { createdAt: 'DESC' },
    });
  }

  async getPopular(limit: number = 10): Promise<EducationalArticle[]> {
    return this.articlesRepository.find({
      where: { isPublished: true },
      relations: ['category', 'subCategory', 'author'],
      order: { viewCount: 'DESC' },
      take: limit,
    });
  }

  async create(createDto: CreateEducationalArticleDto): Promise<EducationalArticle> {
    const article = this.articlesRepository.create({
      ...createDto,
      isPublished: createDto.isPublished || false,
      publishedAt: createDto.isPublished ? new Date() : null,
    });
    return this.articlesRepository.save(article);
  }

  async update(
    id: string,
    updateDto: UpdateEducationalArticleDto,
  ): Promise<EducationalArticle> {
    const article = await this.findOne(id);

    // If publishing for the first time, set publishedAt
    if (updateDto.isPublished === true && !article.isPublished) {
      updateDto['publishedAt'] = new Date();
    }

    Object.assign(article, updateDto);
    return this.articlesRepository.save(article);
  }

  async remove(id: string): Promise<void> {
    const article = await this.findOne(id);
    await this.articlesRepository.remove(article);
  }
}


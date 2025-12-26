import { IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class CreateEducationalArticleDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  excerpt?: string;

  @IsString()
  content: string;

  @IsString()
  @IsOptional()
  featuredImage?: string;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsUUID()
  @IsOptional()
  subCategoryId?: string;

  @IsUUID()
  authorId: string;

  @IsString()
  @IsOptional()
  metaTitle?: string;

  @IsString()
  @IsOptional()
  metaDescription?: string;

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}


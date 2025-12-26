import { IsString, IsOptional, MinLength, MaxLength, IsUUID, IsInt, Min } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @MinLength(2, { message: 'عنوان باید حداقل 2 کاراکتر باشد' })
  @MaxLength(255, { message: 'عنوان نمی‌تواند بیشتر از 255 کاراکتر باشد' })
  title: string;

  @IsString()
  @IsOptional()
  @MinLength(2, { message: 'اسلاگ باید حداقل 2 کاراکتر باشد' })
  @MaxLength(255, { message: 'اسلاگ نمی‌تواند بیشتر از 255 کاراکتر باشد' })
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  parentId?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  level?: number;

  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'متا تایتل نمی‌تواند بیشتر از 255 کاراکتر باشد' })
  metaTitle?: string;

  @IsString()
  @IsOptional()
  metaDescription?: string;
}


import { IsString, IsOptional, IsBoolean, MinLength, MaxLength } from 'class-validator';

export class UpdateCityDto {
  @IsString()
  @IsOptional()
  @MinLength(2, { message: 'عنوان باید حداقل 2 کاراکتر باشد' })
  @MaxLength(255, { message: 'عنوان نمی‌تواند بیشتر از 255 کاراکتر باشد' })
  title?: string;

  @IsString()
  @IsOptional()
  @MinLength(2, { message: 'اسلاگ باید حداقل 2 کاراکتر باشد' })
  @MaxLength(255, { message: 'اسلاگ نمی‌تواند بیشتر از 255 کاراکتر باشد' })
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}


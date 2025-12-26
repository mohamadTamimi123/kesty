import { IsString, IsUUID, IsEnum, IsOptional, IsBoolean, MinLength, MaxLength, IsDateString } from 'class-validator';
import { QuantityEstimate } from '../entities/project.entity';

export class CreateProjectDto {
  @IsString()
  @MinLength(3, { message: 'عنوان باید حداقل 3 کاراکتر باشد' })
  @MaxLength(255, { message: 'عنوان نمی‌تواند بیشتر از 255 کاراکتر باشد' })
  title: string;

  @IsString()
  @MinLength(10, { message: 'توضیحات باید حداقل 10 کاراکتر باشد' })
  description: string;

  @IsUUID('4', { message: 'شناسه شهر معتبر نیست' })
  cityId: string;

  @IsUUID('4', { message: 'شناسه کتگوری معتبر نیست' })
  categoryId: string;

  @IsUUID('4', { message: 'شناسه زیرکتگوری معتبر نیست' })
  @IsOptional()
  subCategoryId?: string;

  @IsUUID('4', { message: 'شناسه ماشین معتبر نیست' })
  @IsOptional()
  machineId?: string;

  @IsDateString({}, { message: 'تاریخ تکمیل معتبر نیست' })
  @IsOptional()
  completionDate?: string;

  @IsString()
  @MaxLength(255, { message: 'نام مشتری نمی‌تواند بیشتر از 255 کاراکتر باشد' })
  @IsOptional()
  clientName?: string;

  @IsEnum(QuantityEstimate, { message: 'تخمین تعداد معتبر نیست' })
  @IsOptional()
  quantityEstimate?: QuantityEstimate;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}


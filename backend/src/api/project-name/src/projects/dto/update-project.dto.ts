import { IsString, IsEnum, IsOptional, IsBoolean, MinLength, MaxLength, IsUUID, IsDateString } from 'class-validator';
import { ProjectStatus, QuantityEstimate } from '../entities/project.entity';

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  @MinLength(3, { message: 'عنوان باید حداقل 3 کاراکتر باشد' })
  @MaxLength(255, { message: 'عنوان نمی‌تواند بیشتر از 255 کاراکتر باشد' })
  title?: string;

  @IsString()
  @IsOptional()
  @MinLength(10, { message: 'توضیحات باید حداقل 10 کاراکتر باشد' })
  description?: string;

  @IsUUID('4', { message: 'شناسه زیرکتگوری معتبر نیست' })
  @IsOptional()
  subCategoryId?: string | null;

  @IsUUID('4', { message: 'شناسه ماشین معتبر نیست' })
  @IsOptional()
  machineId?: string | null;

  @IsDateString({}, { message: 'تاریخ تکمیل معتبر نیست' })
  @IsOptional()
  completionDate?: string | null;

  @IsString()
  @MaxLength(255, { message: 'نام مشتری نمی‌تواند بیشتر از 255 کاراکتر باشد' })
  @IsOptional()
  clientName?: string | null;

  @IsEnum(QuantityEstimate, { message: 'تخمین تعداد معتبر نیست' })
  @IsOptional()
  quantityEstimate?: QuantityEstimate;

  @IsEnum(ProjectStatus, { message: 'وضعیت معتبر نیست' })
  @IsOptional()
  status?: ProjectStatus;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}


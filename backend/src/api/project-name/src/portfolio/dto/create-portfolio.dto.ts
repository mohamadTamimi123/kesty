import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuantityRange } from '../entities/portfolio.entity';

export class CreatePortfolioImageDto {
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @IsOptional()
  @Type(() => Number)
  order?: number;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class CreatePortfolioDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @IsOptional()
  @IsUUID()
  subcategoryId?: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsDateString()
  @IsNotEmpty()
  completionDate: string;

  @IsOptional()
  @IsEnum(QuantityRange)
  quantityRange?: QuantityRange;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  machineIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  materialIds?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePortfolioImageDto)
  images?: CreatePortfolioImageDto[];
}


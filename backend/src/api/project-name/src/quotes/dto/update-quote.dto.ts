import { IsOptional, IsNumber, IsString, IsEnum, Min } from 'class-validator';
import { QuoteStatus } from '../entities/quote.entity';

export class UpdateQuoteDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  deliveryTimeDays?: number;

  @IsOptional()
  @IsEnum(QuoteStatus)
  status?: QuoteStatus;
}


import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class CreateReviewRequestDto {
  @IsUUID()
  @IsNotEmpty()
  portfolioId: string;

  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @IsOptional()
  @IsString()
  message?: string;
}


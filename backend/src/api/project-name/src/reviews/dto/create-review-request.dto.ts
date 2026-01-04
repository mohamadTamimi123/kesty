import { IsString, IsNotEmpty, IsUUID, IsOptional, IsEmail, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateReviewRequestDto {
  @IsUUID()
  @IsNotEmpty()
  portfolioId: string;

  @IsUUID()
  @IsOptional()
  customerId?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  generateToken?: boolean; // If true, generate a one-time token instead of requiring customerId
}


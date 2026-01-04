import { IsOptional, IsString, IsEmail, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(11)
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  workshopName?: string;

  @IsOptional()
  @IsString()
  workshopAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  workshopPhone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  specialties?: string;

  @IsOptional()
  @IsString()
  experience?: string;
}


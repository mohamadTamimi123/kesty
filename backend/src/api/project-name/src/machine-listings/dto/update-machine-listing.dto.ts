import { IsString, IsOptional, IsEnum, IsNumber, IsUUID, IsBoolean, Min, IsInt } from 'class-validator';
import { ListingType, MachineCondition } from '../entities/machine-listing.entity';

export class UpdateMachineListingDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsUUID()
  @IsOptional()
  machineId?: string;

  @IsEnum(ListingType)
  @IsOptional()
  listingType?: ListingType;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsUUID()
  @IsOptional()
  cityId?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(MachineCondition)
  @IsOptional()
  condition?: MachineCondition;

  @IsString()
  @IsOptional()
  contactPhone?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isSold?: boolean;

  @IsInt()
  @Min(0)
  @IsOptional()
  viewCount?: number;
}


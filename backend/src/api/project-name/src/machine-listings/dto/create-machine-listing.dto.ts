import { IsString, IsOptional, IsEnum, IsNumber, IsUUID, IsBoolean, Min } from 'class-validator';
import { ListingType, MachineCondition } from '../entities/machine-listing.entity';

export class CreateMachineListingDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsUUID()
  supplierProfileId: string;

  @IsUUID()
  @IsOptional()
  machineId?: string;

  @IsEnum(ListingType)
  listingType: ListingType;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsUUID()
  cityId: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(MachineCondition)
  @IsOptional()
  condition?: MachineCondition;

  @IsString()
  contactPhone: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}


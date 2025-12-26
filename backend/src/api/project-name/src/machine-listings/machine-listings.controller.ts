import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { MachineListingsService, MachineListingFilters } from './machine-listings.service';
import { CreateMachineListingDto } from './dto/create-machine-listing.dto';
import { UpdateMachineListingDto } from './dto/update-machine-listing.dto';
import { ListingType, MachineCondition } from './entities/machine-listing.entity';

@Controller('machine-listings')
export class MachineListingsController {
  constructor(private readonly machineListingsService: MachineListingsService) {}

  @Post()
  create(@Body() createDto: CreateMachineListingDto) {
    return this.machineListingsService.create(createDto);
  }

  @Get()
  findAll(
    @Query('cityId') cityId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('subCategoryId') subCategoryId?: string,
    @Query('machineId') machineId?: string,
    @Query('listingType') listingType?: ListingType,
    @Query('condition') condition?: MachineCondition,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('isActive') isActive?: string,
  ) {
    const filters: MachineListingFilters = {};
    if (cityId) filters.cityId = cityId;
    if (categoryId) filters.categoryId = categoryId;
    if (subCategoryId) filters.subCategoryId = subCategoryId;
    if (machineId) filters.machineId = machineId;
    if (listingType) filters.listingType = listingType;
    if (condition) filters.condition = condition;
    if (minPrice) filters.minPrice = parseFloat(minPrice);
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    return this.machineListingsService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.machineListingsService.findOne(id);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.machineListingsService.findBySlug(slug);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateMachineListingDto) {
    return this.machineListingsService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.machineListingsService.remove(id);
  }
}


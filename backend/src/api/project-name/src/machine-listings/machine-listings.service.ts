import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { MachineListing, ListingType, MachineCondition } from './entities/machine-listing.entity';
import { CreateMachineListingDto } from './dto/create-machine-listing.dto';
import { UpdateMachineListingDto } from './dto/update-machine-listing.dto';

export interface MachineListingFilters {
  cityId?: string;
  categoryId?: string;
  subCategoryId?: string;
  machineId?: string;
  listingType?: ListingType;
  condition?: MachineCondition;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
}

@Injectable()
export class MachineListingsService {
  constructor(
    @InjectRepository(MachineListing)
    private listingsRepository: Repository<MachineListing>,
  ) {}

  async findAll(filters?: MachineListingFilters): Promise<MachineListing[]> {
    const query = this.listingsRepository
      .createQueryBuilder('listing')
      .leftJoinAndSelect('listing.machine', 'machine')
      .leftJoinAndSelect('listing.city', 'city')
      .leftJoinAndSelect('listing.supplierProfile', 'supplierProfile');

    if (filters) {
      if (filters.cityId) {
        query.andWhere('listing.cityId = :cityId', { cityId: filters.cityId });
      }

      if (filters.machineId) {
        query.andWhere('listing.machineId = :machineId', { machineId: filters.machineId });
      }

      if (filters.listingType) {
        query.andWhere('listing.listingType = :listingType', { listingType: filters.listingType });
      }

      if (filters.condition) {
        query.andWhere('listing.condition = :condition', { condition: filters.condition });
      }

      if (filters.minPrice !== undefined) {
        query.andWhere('listing.price >= :minPrice', { minPrice: filters.minPrice });
      }

      if (filters.maxPrice !== undefined) {
        query.andWhere('listing.price <= :maxPrice', { maxPrice: filters.maxPrice });
      }

      if (filters.isActive !== undefined) {
        query.andWhere('listing.isActive = :isActive', { isActive: filters.isActive });
      }

      // Filter by category through machine
      if (filters.categoryId || filters.subCategoryId) {
        query.leftJoin('machine.category', 'category');
        if (filters.categoryId) {
          query.andWhere('category.parentId = :categoryId', { categoryId: filters.categoryId });
        }
        if (filters.subCategoryId) {
          query.andWhere('category.id = :subCategoryId', { subCategoryId: filters.subCategoryId });
        }
      }
    }

    // Only show active and not sold listings by default
    if (!filters || filters.isActive === undefined) {
      query.andWhere('listing.isActive = :isActive', { isActive: true });
      query.andWhere('listing.isSold = :isSold', { isSold: false });
    }

    return query.orderBy('listing.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<MachineListing> {
    const listing = await this.listingsRepository.findOne({
      where: { id },
      relations: ['machine', 'city', 'supplierProfile'],
    });
    if (!listing) {
      throw new NotFoundException(`Machine listing with ID ${id} not found`);
    }
    return listing;
  }

  async findBySlug(slug: string): Promise<MachineListing> {
    const listing = await this.listingsRepository.findOne({
      where: { slug },
      relations: ['machine', 'city', 'supplierProfile'],
    });
    if (!listing) {
      throw new NotFoundException(`Machine listing with slug ${slug} not found`);
    }
    // Increment view count
    listing.viewCount += 1;
    await this.listingsRepository.save(listing);
    return listing;
  }

  async create(createDto: CreateMachineListingDto): Promise<MachineListing> {
    const listing = this.listingsRepository.create({
      ...createDto,
      isActive: createDto.isActive !== undefined ? createDto.isActive : true,
    });
    return this.listingsRepository.save(listing);
  }

  async update(
    id: string,
    updateDto: UpdateMachineListingDto,
  ): Promise<MachineListing> {
    const listing = await this.findOne(id);
    Object.assign(listing, updateDto);
    return this.listingsRepository.save(listing);
  }

  async remove(id: string): Promise<void> {
    const listing = await this.findOne(id);
    await this.listingsRepository.remove(listing);
  }
}


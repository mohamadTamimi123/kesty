import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { City } from './entities/city.entity';
import { CitySupplier } from './entities/city-supplier.entity';

@Injectable()
export class CitiesService {
  constructor(
    @InjectRepository(City)
    private citiesRepository: Repository<City>,
    @InjectRepository(CitySupplier)
    private citySupplierRepository: Repository<CitySupplier>,
  ) {}

  /**
   * Generate slug from title
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-z0-9\s-]/g, '') // Remove special chars, keep Persian/Arabic and alphanumeric
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Generate unique slug by appending number if needed
   */
  private async generateUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await this.citiesRepository.findOne({
        where: { slug },
      });

      if (!existing || (excludeId && existing.id === excludeId)) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  async findAll(): Promise<City[]> {
    return this.citiesRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findActive(): Promise<City[]> {
    return this.citiesRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<City | null> {
    return this.citiesRepository.findOne({ where: { id } });
  }

  async findBySlug(slug: string, activeOnly: boolean = false): Promise<City | null> {
    const where: any = { slug };
    if (activeOnly) {
      where.isActive = true;
    }
    return this.citiesRepository.findOne({ where });
  }

  async create(cityData: {
    title: string;
    slug?: string;
    description?: string;
    logoUrl?: string;
  }): Promise<City> {
    // Generate slug if not provided
    let slug = cityData.slug;
    if (!slug || slug.trim() === '') {
      slug = this.generateSlug(cityData.title);
    } else {
      slug = this.generateSlug(slug);
    }

    // Ensure slug is unique
    slug = await this.generateUniqueSlug(slug);

    const city = this.citiesRepository.create({
      title: cityData.title,
      slug,
      description: cityData.description || null,
      logoUrl: cityData.logoUrl || null,
      isActive: true,
    });

    return await this.citiesRepository.save(city);
  }

  async update(id: string, updateData: Partial<City>): Promise<City> {
    const city = await this.findById(id);
    if (!city) {
      throw new NotFoundException(`شهر با شناسه ${id} یافت نشد`);
    }

    // Handle slug update
    if (updateData.slug) {
      updateData.slug = this.generateSlug(updateData.slug);
      updateData.slug = await this.generateUniqueSlug(updateData.slug, id);
    } else if (updateData.title && updateData.title !== city.title) {
      // If title changed but slug not provided, regenerate slug
      const newSlug = this.generateSlug(updateData.title);
      updateData.slug = await this.generateUniqueSlug(newSlug, id);
    }

    await this.citiesRepository.update(id, updateData);
    const updatedCity = await this.findById(id);
    if (!updatedCity) {
      throw new NotFoundException(`شهر با شناسه ${id} پس از به‌روزرسانی یافت نشد`);
    }
    return updatedCity;
  }

  async delete(id: string): Promise<void> {
    const city = await this.findById(id);
    if (!city) {
      throw new NotFoundException(`شهر با شناسه ${id} یافت نشد`);
    }

    // Delete city-supplier relationships
    await this.citySupplierRepository.delete({ cityId: id });

    const result = await this.citiesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`شهر با شناسه ${id} یافت نشد`);
    }
  }

  /**
   * Add city to supplier
   */
  async addCityToSupplier(cityId: string, supplierId: string): Promise<CitySupplier> {
    const city = await this.findById(cityId);
    if (!city) {
      throw new NotFoundException(`شهر با شناسه ${cityId} یافت نشد`);
    }

    // Check if relationship already exists
    const existing = await this.citySupplierRepository.findOne({
      where: { cityId, supplierId },
    });
    if (existing) {
      return existing;
    }

    const citySupplier = this.citySupplierRepository.create({
      cityId,
      supplierId,
    });

    return await this.citySupplierRepository.save(citySupplier);
  }

  /**
   * Remove city from supplier
   */
  async removeCityFromSupplier(cityId: string, supplierId: string): Promise<void> {
    const result = await this.citySupplierRepository.delete({
      cityId,
      supplierId,
    });
    if (result.affected === 0) {
      throw new NotFoundException('رابطه شهر و تولیدکننده یافت نشد');
    }
  }

  /**
   * Get cities for a supplier
   */
  async getCitiesForSupplier(supplierId: string): Promise<City[]> {
    const citySuppliers = await this.citySupplierRepository.find({
      where: { supplierId },
      relations: ['city'],
    });
    return citySuppliers.map((cs) => cs.city);
  }

  /**
   * Get suppliers for a city
   */
  async getSuppliersForCity(cityId: string): Promise<string[]> {
    const citySuppliers = await this.citySupplierRepository.find({
      where: { cityId },
    });
    return citySuppliers.map((cs) => cs.supplierId);
  }
}


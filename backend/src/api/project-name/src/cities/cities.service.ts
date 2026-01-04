import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { City } from './entities/city.entity';
import { CitySupplier } from './entities/city-supplier.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Project } from '../projects/entities/project.entity';
import { SupplierRating } from '../rating/entities/supplier-rating.entity';
import { CategorySupplier } from '../categories/entities/category-supplier.entity';
import { Category } from '../categories/entities/category.entity';
import { CacheService } from '../common/services/cache.service';

@Injectable()
export class CitiesService {
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(
    @InjectRepository(City)
    private citiesRepository: Repository<City>,
    @InjectRepository(CitySupplier)
    private citySupplierRepository: Repository<CitySupplier>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(SupplierRating)
    private ratingRepository: Repository<SupplierRating>,
    @InjectRepository(CategorySupplier)
    private categorySupplierRepository: Repository<CategorySupplier>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private cacheService: CacheService,
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
    const cacheKey = 'cities:active';
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        return this.citiesRepository.find({
          where: { isActive: true },
          order: { createdAt: 'DESC' },
        });
      },
      this.CACHE_TTL,
    );
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

    // Invalidate cache after creation
    await this.cacheService.invalidate('cities:*');

    return await this.citiesRepository.save(city);
  }

  async update(id: string, updateData: Partial<City>): Promise<City> {
    const city = await this.findById(id);
    if (!city) {
      throw new NotFoundException(`شهر با شناسه ${id} یافت نشد`);
    }

    // Invalidate cache before update
    await this.cacheService.invalidate('cities:*');

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

    // Invalidate cache after deletion
    await this.cacheService.invalidate('cities:*');
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

  /**
   * Get city statistics
   */
  async getCityStats(slug: string): Promise<{ workshops: number; projects: number }> {
    const city = await this.findBySlug(slug);
    if (!city) {
      throw new NotFoundException('شهر یافت نشد');
    }

    const supplierIds = await this.getSuppliersForCity(city.id);
    const workshops = supplierIds.length;

    const projects = await this.projectRepository.count({
      where: { cityId: city.id },
    });

    return { workshops, projects };
  }

  /**
   * Get top suppliers in a city by rating
   */
  async getTopSuppliers(slug: string, limit: number = 5): Promise<User[]> {
    const city = await this.findBySlug(slug);
    if (!city) {
      throw new NotFoundException('شهر یافت نشد');
    }

    const supplierIds = await this.getSuppliersForCity(city.id);
    if (supplierIds.length === 0) {
      return [];
    }

    const ratings = await this.ratingRepository
      .createQueryBuilder('rating')
      .where('rating.supplierId IN (:...ids)', { ids: supplierIds })
      .orderBy('rating.totalScore', 'DESC')
      .take(limit)
      .getMany();

    const topSupplierIds = ratings.map((r) => r.supplierId);
    if (topSupplierIds.length === 0) {
      return [];
    }

    const suppliers = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id IN (:...ids)', { ids: topSupplierIds })
      .andWhere('user.role = :role', { role: UserRole.SUPPLIER })
      .andWhere('user.isActive = :isActive', { isActive: true })
      .getMany();

    // Sort by rating order
    return topSupplierIds
      .map((id) => suppliers.find((s) => s.id === id))
      .filter((s): s is User => s !== undefined);
  }

  /**
   * Get latest registered suppliers in a city
   */
  async getLatestSuppliers(slug: string, limit: number = 5): Promise<User[]> {
    const city = await this.findBySlug(slug);
    if (!city) {
      throw new NotFoundException('شهر یافت نشد');
    }

    const supplierIds = await this.getSuppliersForCity(city.id);
    if (supplierIds.length === 0) {
      return [];
    }

    const suppliers = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id IN (:...ids)', { ids: supplierIds })
      .andWhere('user.role = :role', { role: UserRole.SUPPLIER })
      .andWhere('user.isActive = :isActive', { isActive: true })
      .orderBy('user.createdAt', 'DESC')
      .take(limit)
      .getMany();

    return suppliers;
  }

  /**
   * Get categories available in a city
   */
  async getCityCategories(slug: string): Promise<Category[]> {
    const city = await this.findBySlug(slug);
    if (!city) {
      throw new NotFoundException('شهر یافت نشد');
    }

    const supplierIds = await this.getSuppliersForCity(city.id);
    if (supplierIds.length === 0) {
      return [];
    }

    const categorySuppliers = await this.categorySupplierRepository
      .createQueryBuilder('cs')
      .where('cs.supplierId IN (:...ids)', { ids: supplierIds })
      .leftJoinAndSelect('cs.category', 'category')
      .getMany();

    const categoryIds = [...new Set(categorySuppliers.map((cs) => cs.categoryId))];
    if (categoryIds.length === 0) {
      return [];
    }

    const categories = await this.categoryRepository
      .createQueryBuilder('category')
      .where('category.id IN (:...ids)', { ids: categoryIds })
      .andWhere('category.isActive = :isActive', { isActive: true })
      .orderBy('category.order', 'ASC')
      .getMany();

    return categories;
  }

  /**
   * Get suppliers filtered by city and category with optional filters
   */
  async getCityCategorySuppliers(
    citySlug: string,
    categorySlug: string,
    filters?: {
      subcategory?: string;
      minRating?: number;
      equipment?: string[];
      establishedYear?: number;
    },
  ): Promise<User[]> {
    const city = await this.findBySlug(citySlug);
    if (!city) {
      throw new NotFoundException('شهر یافت نشد');
    }

    // Get category
    const category = await this.categoryRepository.findOne({
      where: { slug: categorySlug, isActive: true },
    });
    if (!category) {
      throw new NotFoundException('کتگوری یافت نشد');
    }

    // Get suppliers in city
    const citySupplierIds = await this.getSuppliersForCity(city.id);
    if (citySupplierIds.length === 0) {
      return [];
    }

    // Get suppliers in category
    const categorySuppliers = await this.categorySupplierRepository.find({
      where: { categoryId: category.id },
    });
    const categorySupplierIds = categorySuppliers.map((cs) => cs.supplierId);

    // Intersection: suppliers in both city and category
    const supplierIds = citySupplierIds.filter((id) => categorySupplierIds.includes(id));
    if (supplierIds.length === 0) {
      return [];
    }

    // Build query with filters
    let query = this.userRepository
      .createQueryBuilder('user')
      .where('user.id IN (:...ids)', { ids: supplierIds })
      .andWhere('user.role = :role', { role: UserRole.SUPPLIER })
      .andWhere('user.isActive = :isActive', { isActive: true });

    // Apply rating filter
    if (filters?.minRating) {
      const ratings = await this.ratingRepository
        .createQueryBuilder('rating')
        .where('rating.supplierId IN (:...ids)', { ids: supplierIds })
        .andWhere('rating.totalScore >= :minRating', { minRating: filters.minRating })
        .getMany();
      const ratedSupplierIds = ratings.map((r) => r.supplierId);
      query = query.andWhere('user.id IN (:...ratedIds)', { ratedIds: ratedSupplierIds });
    }

    // Apply establishment year filter (if user entity has this field)
    // This is a placeholder - adjust based on actual User entity structure

    const suppliers = await query.getMany();

    // Apply subcategory filter if needed
    if (filters?.subcategory) {
      const subcategory = await this.categoryRepository.findOne({
        where: { slug: filters.subcategory, isActive: true },
      });
      if (subcategory) {
        const subcategorySuppliers = await this.categorySupplierRepository.find({
          where: { categoryId: subcategory.id },
        });
        const subcategorySupplierIds = subcategorySuppliers.map((cs) => cs.supplierId);
        return suppliers.filter((s) => subcategorySupplierIds.includes(s.id));
      }
    }

    return suppliers;
  }

  /**
   * Get combined stats for city and category
   */
  async getCityCategoryStats(
    citySlug: string,
    categorySlug: string,
  ): Promise<{ workshops: number; projects: number }> {
    const city = await this.findBySlug(citySlug);
    if (!city) {
      throw new NotFoundException('شهر یافت نشد');
    }

    const category = await this.categoryRepository.findOne({
      where: { slug: categorySlug, isActive: true },
    });
    if (!category) {
      throw new NotFoundException('کتگوری یافت نشد');
    }

    // Get suppliers in city
    const citySupplierIds = await this.getSuppliersForCity(city.id);

    // Get suppliers in category
    const categorySuppliers = await this.categorySupplierRepository.find({
      where: { categoryId: category.id },
    });
    const categorySupplierIds = categorySuppliers.map((cs) => cs.supplierId);

    // Intersection: suppliers in both city and category
    const supplierIds = citySupplierIds.filter((id) => categorySupplierIds.includes(id));
    const workshops = supplierIds.length;

    // Count projects (simplified - would need proper Project-Category relationship)
    const projects = await this.projectRepository.count({
      where: { cityId: city.id },
    });

    return { workshops, projects };
  }
}


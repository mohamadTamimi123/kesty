import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Category } from './entities/category.entity';
import { CategorySupplier } from './entities/category-supplier.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { SupplierRating } from '../rating/entities/supplier-rating.entity';
import { CitySupplier } from '../cities/entities/city-supplier.entity';
import { City } from '../cities/entities/city.entity';
import { EducationalArticle } from '../educational-articles/entities/educational-article.entity';
import { CacheService } from '../common/services/cache.service';

@Injectable()
export class CategoriesService {
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
    @InjectRepository(CategorySupplier)
    private categorySupplierRepository: Repository<CategorySupplier>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(SupplierRating)
    private ratingRepository: Repository<SupplierRating>,
    @InjectRepository(CitySupplier)
    private citySupplierRepository: Repository<CitySupplier>,
    @InjectRepository(City)
    private cityRepository: Repository<City>,
    @InjectRepository(EducationalArticle)
    private articleRepository: Repository<EducationalArticle>,
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
      const existing = await this.categoriesRepository.findOne({
        where: { slug },
      });

      if (!existing || (excludeId && existing.id === excludeId)) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  async findAll(): Promise<Category[]> {
    return this.categoriesRepository.find({
      order: { order: 'ASC', createdAt: 'DESC' },
    });
  }

  async findActive(): Promise<Category[]> {
    const cacheKey = 'categories:active';
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        return this.categoriesRepository.find({
          where: { isActive: true },
          order: { order: 'ASC', createdAt: 'DESC' },
        });
      },
      this.CACHE_TTL,
    );
  }

  async findById(id: string): Promise<Category | null> {
    return this.categoriesRepository.findOne({ where: { id } });
  }

  async findBySlug(slug: string): Promise<Category | null> {
    return this.categoriesRepository.findOne({ where: { slug, isActive: true } });
  }

  async create(categoryData: {
    title: string;
    slug?: string;
    description?: string;
    iconUrl?: string;
    metaTitle?: string;
    metaDescription?: string;
    parentId?: string;
    level?: number;
    order?: number;
  }): Promise<Category> {
    // Generate slug if not provided
    let slug = categoryData.slug;
    if (!slug || slug.trim() === '') {
      slug = this.generateSlug(categoryData.title);
    } else {
      slug = this.generateSlug(slug);
    }

    // Ensure slug is unique
    slug = await this.generateUniqueSlug(slug);

    // Validate parent if provided
    let parent: Category | null = null;
    let level = 1;
    if (categoryData.parentId) {
      parent = await this.findById(categoryData.parentId);
      if (!parent) {
        throw new NotFoundException(`دسته والد با شناسه ${categoryData.parentId} یافت نشد`);
      }
      level = parent.level + 1;
    }

    // Use provided level or calculate from parent
    if (categoryData.level !== undefined) {
      level = categoryData.level;
    }

    // Calculate order if not provided
    let order = categoryData.order;
    if (order === undefined) {
      const siblings = await this.categoriesRepository.find({
        where: categoryData.parentId 
          ? { parentId: categoryData.parentId }
          : { parentId: IsNull() },
      });
      order = siblings.length > 0 ? Math.max(...siblings.map((s) => s.order || 0)) + 1 : 0;
    }

    const category = this.categoriesRepository.create({
      title: categoryData.title,
      slug,
      description: categoryData.description || null,
      iconUrl: categoryData.iconUrl || null,
      metaTitle: categoryData.metaTitle || null,
      metaDescription: categoryData.metaDescription || null,
      parentId: categoryData.parentId || null,
      level,
      order,
      isActive: true,
    });

    const savedCategory = await this.categoriesRepository.save(category);

    // Invalidate cache after creation
    await this.cacheService.invalidate('categories:*');

    return savedCategory;
  }

  async update(id: string, updateData: Partial<Category>): Promise<Category> {
    const category = await this.findById(id);
    if (!category) {
      throw new NotFoundException(`کتگوری با شناسه ${id} یافت نشد`);
    }

    // Prevent circular reference
    if (updateData.parentId === id) {
      throw new BadRequestException('دسته نمی‌تواند والد خودش باشد');
    }

    // Validate parent if provided
    if (updateData.parentId !== undefined) {
      if (updateData.parentId === null) {
        updateData.level = 1;
      } else {
        const parent = await this.findById(updateData.parentId);
        if (!parent) {
          throw new NotFoundException(`دسته والد با شناسه ${updateData.parentId} یافت نشد`);
        }
        // Check if parent is a descendant of this category (prevent circular reference)
        const isDescendant = await this.isDescendantOf(updateData.parentId, id);
        if (isDescendant) {
          throw new BadRequestException('دسته والد نمی‌تواند زیرمجموعه این دسته باشد');
        }
        updateData.level = parent.level + 1;
      }
    }

    // Handle slug update
    if (updateData.slug) {
      updateData.slug = this.generateSlug(updateData.slug);
      updateData.slug = await this.generateUniqueSlug(updateData.slug, id);
    } else if (updateData.title && updateData.title !== category.title) {
      // If title changed but slug not provided, regenerate slug
      const newSlug = this.generateSlug(updateData.title);
      updateData.slug = await this.generateUniqueSlug(newSlug, id);
    }

    await this.categoriesRepository.update(id, updateData);
    const updatedCategory = await this.findById(id);
    if (!updatedCategory) {
      throw new NotFoundException(`کتگوری با شناسه ${id} پس از به‌روزرسانی یافت نشد`);
    }

    // Invalidate cache after update
    await this.cacheService.invalidate('categories:*');

    return updatedCategory;
  }

  /**
   * Check if a category is a descendant of another category
   */
  private async isDescendantOf(ancestorId: string, descendantId: string): Promise<boolean> {
    const descendant = await this.findById(descendantId);
    if (!descendant || !descendant.parentId) {
      return false;
    }
    if (descendant.parentId === ancestorId) {
      return true;
    }
    return this.isDescendantOf(ancestorId, descendant.parentId);
  }

  async delete(id: string): Promise<void> {
    const category = await this.findById(id);
    if (!category) {
      throw new NotFoundException(`کتگوری با شناسه ${id} یافت نشد`);
    }

    // Check if category has children
    const children = await this.categoriesRepository.find({
      where: { parentId: id },
    });
    if (children.length > 0) {
      throw new BadRequestException('نمی‌توان دسته‌ای که دارای زیردسته است را حذف کرد');
    }

    // Delete category-supplier relationships
    await this.categorySupplierRepository.delete({ categoryId: id });

    const result = await this.categoriesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`کتگوری با شناسه ${id} یافت نشد`);
    }

    // Invalidate cache after deletion
    await this.cacheService.invalidate('categories:*');
  }

  /**
   * Get categories by level
   */
  async findByLevel(level: number): Promise<Category[]> {
    return this.categoriesRepository.find({
      where: { level, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get root categories (level 1)
   */
  async findRootCategories(): Promise<Category[]> {
    return this.findByLevel(1);
  }

  /**
   * Get children of a category
   */
  async findChildren(parentId: string): Promise<Category[]> {
    return this.categoriesRepository.find({
      where: { parentId, isActive: true },
      order: { order: 'ASC', createdAt: 'DESC' },
    });
  }

  /**
   * Add category to supplier
   */
  async addCategoryToSupplier(categoryId: string, supplierId: string): Promise<CategorySupplier> {
    const category = await this.findById(categoryId);
    if (!category) {
      throw new NotFoundException(`کتگوری با شناسه ${categoryId} یافت نشد`);
    }

    // Check if relationship already exists
    const existing = await this.categorySupplierRepository.findOne({
      where: { categoryId, supplierId },
    });
    if (existing) {
      return existing;
    }

    const categorySupplier = this.categorySupplierRepository.create({
      categoryId,
      supplierId,
    });

    return await this.categorySupplierRepository.save(categorySupplier);
  }

  /**
   * Remove category from supplier
   */
  async removeCategoryFromSupplier(categoryId: string, supplierId: string): Promise<void> {
    const result = await this.categorySupplierRepository.delete({
      categoryId,
      supplierId,
    });
    if (result.affected === 0) {
      throw new NotFoundException('رابطه دسته و تولیدکننده یافت نشد');
    }
  }

  /**
   * Get categories for a supplier
   */
  async getCategoriesForSupplier(supplierId: string): Promise<Category[]> {
    const categorySuppliers = await this.categorySupplierRepository.find({
      where: { supplierId },
      relations: ['category'],
    });
    return categorySuppliers.map((cs) => cs.category);
  }

  /**
   * Get suppliers for a category
   */
  async getSuppliersForCategory(categoryId: string): Promise<string[]> {
    const categorySuppliers = await this.categorySupplierRepository.find({
      where: { categoryId },
    });
    return categorySuppliers.map((cs) => cs.supplierId);
  }

  /**
   * Get category tree (all categories with nested children)
   */
  async getCategoryTree(): Promise<Category[]> {
    const cacheKey = 'categories:tree';
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const allCategories = await this.categoriesRepository.find({
          where: { isActive: true },
          relations: ['parent', 'children'],
          order: { level: 'ASC', order: 'ASC', createdAt: 'ASC' },
        });

        // Build tree structure
        const categoryMap = new Map<string, Category & { children?: Category[] }>();
        const rootCategories: Category[] = [];

        // First pass: create map and initialize children arrays
        allCategories.forEach((category) => {
          categoryMap.set(category.id, { ...category, children: [] });
        });

        // Second pass: build tree
        allCategories.forEach((category) => {
          const categoryWithChildren = categoryMap.get(category.id)!;
          if (category.parentId && categoryMap.has(category.parentId)) {
            const parent = categoryMap.get(category.parentId)!;
            if (!parent.children) {
              parent.children = [];
            }
            parent.children.push(categoryWithChildren);
          } else {
            rootCategories.push(categoryWithChildren);
          }
        });

        return rootCategories;
      },
      this.CACHE_TTL,
    );
  }

  /**
   * Reorder categories
   */
  async reorderCategories(categoryIds: string[]): Promise<void> {
    // Update order for each category based on its position in the array
    for (let i = 0; i < categoryIds.length; i++) {
      await this.categoriesRepository.update(categoryIds[i], { order: i });
    }
  }

  /**
   * Move category to a new parent
   */
  async moveCategory(
    categoryId: string,
    newParentId: string | null,
    newOrder?: number,
  ): Promise<Category> {
    const category = await this.findById(categoryId);
    if (!category) {
      throw new NotFoundException(`کتگوری با شناسه ${categoryId} یافت نشد`);
    }

    // Prevent circular reference
    if (newParentId === categoryId) {
      throw new BadRequestException('دسته نمی‌تواند والد خودش باشد');
    }

    // Validate parent if provided
    let newLevel = 1;
    if (newParentId) {
      const parent = await this.findById(newParentId);
      if (!parent) {
        throw new NotFoundException(`دسته والد با شناسه ${newParentId} یافت نشد`);
      }
      // Check if parent is a descendant of this category
      const isDescendant = await this.isDescendantOf(newParentId, categoryId);
      if (isDescendant) {
        throw new BadRequestException('دسته والد نمی‌تواند زیرمجموعه این دسته باشد');
      }
      newLevel = parent.level + 1;
    }

    // Calculate order if not provided
    let order = newOrder;
    if (order === undefined) {
      const siblings = await this.categoriesRepository.find({
        where: newParentId 
          ? { parentId: newParentId }
          : { parentId: IsNull() },
      });
      order = siblings.length > 0 ? Math.max(...siblings.map((s) => s.order || 0)) + 1 : 0;
    }

    // Update category
    await this.categoriesRepository.update(categoryId, {
      parentId: newParentId,
      level: newLevel,
      order,
    });

    const updatedCategory = await this.findById(categoryId);
    if (!updatedCategory) {
      throw new NotFoundException(`کتگوری با شناسه ${categoryId} پس از انتقال یافت نشد`);
    }

    return updatedCategory;
  }

  /**
   * Get path from root to category (breadcrumb path)
   */
  async getCategoryPath(categoryId: string): Promise<Category[]> {
    const category = await this.findById(categoryId);
    if (!category) {
      throw new NotFoundException(`کتگوری با شناسه ${categoryId} یافت نشد`);
    }

    const path: Category[] = [category];
    let currentCategory = category;

    while (currentCategory.parentId) {
      const parent = await this.findById(currentCategory.parentId);
      if (!parent) {
        break;
      }
      path.unshift(parent);
      currentCategory = parent;
    }

    return path;
  }

  /**
   * Get category statistics
   */
  async getCategoryStats(slug: string): Promise<{ suppliers: number; projects: number }> {
    const category = await this.findBySlug(slug);
    if (!category) {
      throw new NotFoundException('کتگوری یافت نشد');
    }

    const supplierIds = await this.getSuppliersForCategory(category.id);
    const suppliers = supplierIds.length;

    // Count projects in this category (through suppliers)
    // This is a simplified count - in a real scenario, you might want to count projects by category
    const projects = 0; // Placeholder - would need Project-Category relationship

    return { suppliers, projects };
  }

  /**
   * Get top suppliers in a category by rating (country-wide)
   */
  async getTopSuppliers(slug: string, limit: number = 5): Promise<User[]> {
    const category = await this.findBySlug(slug);
    if (!category) {
      throw new NotFoundException('کتگوری یافت نشد');
    }

    const supplierIds = await this.getSuppliersForCategory(category.id);
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
   * Get cities with this category
   */
  async getCategoryCities(slug: string): Promise<City[]> {
    const category = await this.findBySlug(slug);
    if (!category) {
      throw new NotFoundException('کتگوری یافت نشد');
    }

    const supplierIds = await this.getSuppliersForCategory(category.id);
    if (supplierIds.length === 0) {
      return [];
    }

    const citySuppliers = await this.citySupplierRepository
      .createQueryBuilder('cs')
      .where('cs.supplierId IN (:...ids)', { ids: supplierIds })
      .leftJoinAndSelect('cs.city', 'city')
      .getMany();

    const cityIds = [...new Set(citySuppliers.map((cs) => cs.cityId))];
    if (cityIds.length === 0) {
      return [];
    }

    const cities = await this.cityRepository
      .createQueryBuilder('city')
      .where('city.id IN (:...ids)', { ids: cityIds })
      .andWhere('city.isActive = :isActive', { isActive: true })
      .orderBy('city.title', 'ASC')
      .getMany();

    return cities;
  }

  /**
   * Get subcategories of a category
   */
  async getSubcategories(slug: string): Promise<Category[]> {
    const category = await this.findBySlug(slug);
    if (!category) {
      throw new NotFoundException('کتگوری یافت نشد');
    }

    return this.findChildren(category.id);
  }

  /**
   * Get related educational articles for a category
   */
  async getCategoryArticles(slug: string, limit: number = 5): Promise<EducationalArticle[]> {
    const category = await this.findBySlug(slug);
    if (!category) {
      throw new NotFoundException('کتگوری یافت نشد');
    }

    // Get articles that have this category
    const articles = await this.articleRepository.find({
      where: [
        { categoryId: category.id, isPublished: true },
        { subCategoryId: category.id, isPublished: true },
      ],
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return articles;
  }
}


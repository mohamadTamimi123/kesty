import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CategorySupplier } from './entities/category-supplier.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
    @InjectRepository(CategorySupplier)
    private categorySupplierRepository: Repository<CategorySupplier>,
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
      order: { createdAt: 'DESC' },
    });
  }

  async findActive(): Promise<Category[]> {
    return this.categoriesRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
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

    const category = this.categoriesRepository.create({
      title: categoryData.title,
      slug,
      description: categoryData.description || null,
      iconUrl: categoryData.iconUrl || null,
      metaTitle: categoryData.metaTitle || null,
      metaDescription: categoryData.metaDescription || null,
      parentId: categoryData.parentId || null,
      level,
      isActive: true,
    });

    return await this.categoriesRepository.save(category);
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
      order: { createdAt: 'DESC' },
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
    const allCategories = await this.categoriesRepository.find({
      where: { isActive: true },
      relations: ['parent', 'children'],
      order: { level: 'ASC', createdAt: 'ASC' },
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
}


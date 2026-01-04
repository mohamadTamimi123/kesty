import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getActiveCategories() {
    const categories = await this.categoriesService.findActive();
    return categories;
  }

  @Get('tree')
  @HttpCode(HttpStatus.OK)
  async getCategoryTree() {
    return this.categoriesService.getCategoryTree();
  }

  @Get('root')
  @HttpCode(HttpStatus.OK)
  async getRootCategories() {
    return this.categoriesService.findRootCategories();
  }

  @Get('suppliers/:supplierId')
  @HttpCode(HttpStatus.OK)
  async getSupplierCategories(@Param('supplierId') supplierId: string) {
    const categories = await this.categoriesService.getCategoriesForSupplier(supplierId);
    return { supplierId, categories };
  }

  @Get(':id/children')
  @HttpCode(HttpStatus.OK)
  async getCategoryChildren(@Param('id') id: string) {
    const category = await this.categoriesService.findById(id);
    if (!category) {
      throw new NotFoundException('کتگوری یافت نشد');
    }
    return this.categoriesService.findChildren(id);
  }

  @Get(':id/path')
  @HttpCode(HttpStatus.OK)
  async getCategoryPath(@Param('id') id: string) {
    return this.categoriesService.getCategoryPath(id);
  }

  @Get(':id/suppliers')
  @HttpCode(HttpStatus.OK)
  async getCategorySuppliers(@Param('id') id: string) {
    const category = await this.categoriesService.findById(id);
    if (!category) {
      throw new NotFoundException('کتگوری یافت نشد');
    }
    const supplierIds = await this.categoriesService.getSuppliersForCategory(id);
    return { categoryId: id, supplierIds };
  }

  @Post(':id/suppliers/:supplierId')
  @HttpCode(HttpStatus.CREATED)
  async addCategoryToSupplier(
    @Param('id') categoryId: string,
    @Param('supplierId') supplierId: string,
  ) {
    return this.categoriesService.addCategoryToSupplier(categoryId, supplierId);
  }

  @Delete(':id/suppliers/:supplierId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeCategoryFromSupplier(
    @Param('id') categoryId: string,
    @Param('supplierId') supplierId: string,
  ) {
    await this.categoriesService.removeCategoryFromSupplier(categoryId, supplierId);
  }

  @Get(':slug')
  @HttpCode(HttpStatus.OK)
  async getCategoryBySlug(@Param('slug') slug: string) {
    const category = await this.categoriesService.findBySlug(slug);
    if (!category) {
      throw new NotFoundException('کتگوری یافت نشد');
    }
    return category;
  }

  @Get(':slug/stats')
  @HttpCode(HttpStatus.OK)
  async getCategoryStats(@Param('slug') slug: string) {
    return this.categoriesService.getCategoryStats(slug);
  }

  @Get(':slug/top-suppliers')
  @HttpCode(HttpStatus.OK)
  async getCategoryTopSuppliers(@Param('slug') slug: string) {
    return this.categoriesService.getTopSuppliers(slug, 5);
  }

  @Get(':slug/cities')
  @HttpCode(HttpStatus.OK)
  async getCategoryCities(@Param('slug') slug: string) {
    return this.categoriesService.getCategoryCities(slug);
  }

  @Get(':slug/subcategories')
  @HttpCode(HttpStatus.OK)
  async getCategorySubcategories(@Param('slug') slug: string) {
    return this.categoriesService.getSubcategories(slug);
  }

  @Get(':slug/articles')
  @HttpCode(HttpStatus.OK)
  async getCategoryArticles(@Param('slug') slug: string) {
    return this.categoriesService.getCategoryArticles(slug, 5);
  }
}


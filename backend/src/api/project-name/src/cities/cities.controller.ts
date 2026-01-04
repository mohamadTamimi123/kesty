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
import { CitiesService } from './cities.service';

@Controller('cities')
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getActiveCities() {
    const cities = await this.citiesService.findActive();
    return cities;
  }

  @Get('suppliers/:supplierId')
  @HttpCode(HttpStatus.OK)
  async getSupplierCities(@Param('supplierId') supplierId: string) {
    const cities = await this.citiesService.getCitiesForSupplier(supplierId);
    return { supplierId, cities };
  }

  @Get(':id/suppliers')
  @HttpCode(HttpStatus.OK)
  async getCitySuppliers(@Param('id') id: string) {
    const city = await this.citiesService.findById(id);
    if (!city) {
      throw new NotFoundException('شهر یافت نشد');
    }
    const supplierIds = await this.citiesService.getSuppliersForCity(id);
    return { cityId: id, supplierIds };
  }

  @Post(':id/suppliers/:supplierId')
  @HttpCode(HttpStatus.CREATED)
  async addCityToSupplier(
    @Param('id') cityId: string,
    @Param('supplierId') supplierId: string,
  ) {
    return this.citiesService.addCityToSupplier(cityId, supplierId);
  }

  @Delete(':id/suppliers/:supplierId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeCityFromSupplier(
    @Param('id') cityId: string,
    @Param('supplierId') supplierId: string,
  ) {
    await this.citiesService.removeCityFromSupplier(cityId, supplierId);
  }

  @Get(':slug')
  @HttpCode(HttpStatus.OK)
  async getCityBySlug(@Param('slug') slug: string) {
    const city = await this.citiesService.findBySlug(slug, true);
    if (!city) {
      throw new NotFoundException('شهر یافت نشد');
    }
    return city;
  }

  @Get(':slug/stats')
  @HttpCode(HttpStatus.OK)
  async getCityStats(@Param('slug') slug: string) {
    return this.citiesService.getCityStats(slug);
  }

  @Get(':slug/top-suppliers')
  @HttpCode(HttpStatus.OK)
  async getCityTopSuppliers(@Param('slug') slug: string) {
    return this.citiesService.getTopSuppliers(slug, 5);
  }

  @Get(':slug/latest-suppliers')
  @HttpCode(HttpStatus.OK)
  async getCityLatestSuppliers(@Param('slug') slug: string) {
    return this.citiesService.getLatestSuppliers(slug, 5);
  }

  @Get(':slug/categories')
  @HttpCode(HttpStatus.OK)
  async getCityCategories(@Param('slug') slug: string) {
    return this.citiesService.getCityCategories(slug);
  }

  @Get(':citySlug/categories/:categorySlug/suppliers')
  @HttpCode(HttpStatus.OK)
  async getCityCategorySuppliers(
    @Param('citySlug') citySlug: string,
    @Param('categorySlug') categorySlug: string,
  ) {
    return this.citiesService.getCityCategorySuppliers(citySlug, categorySlug);
  }

  @Get(':citySlug/categories/:categorySlug/stats')
  @HttpCode(HttpStatus.OK)
  async getCityCategoryStats(
    @Param('citySlug') citySlug: string,
    @Param('categorySlug') categorySlug: string,
  ) {
    return this.citiesService.getCityCategoryStats(citySlug, categorySlug);
  }
}


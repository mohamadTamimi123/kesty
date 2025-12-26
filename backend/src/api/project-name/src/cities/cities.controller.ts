import {
  Controller,
  Get,
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

  @Get(':slug')
  @HttpCode(HttpStatus.OK)
  async getCityBySlug(@Param('slug') slug: string) {
    const city = await this.citiesService.findBySlug(slug, true);
    if (!city) {
      throw new NotFoundException('شهر یافت نشد');
    }
    return city;
  }
}


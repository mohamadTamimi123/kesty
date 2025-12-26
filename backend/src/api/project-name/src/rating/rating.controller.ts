import { Controller, Get, Param, Query } from '@nestjs/common';
import { RatingService } from './rating.service';

@Controller('rating')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Get('supplier/:supplierId')
  async getSupplierRating(@Param('supplierId') supplierId: string) {
    return this.ratingService.getSupplierRating(supplierId);
  }

  @Get('top-suppliers')
  async getTopSuppliers(@Query('limit') limit?: string) {
    // This should return top suppliers sorted by rating
    // For now, return empty array
    return [];
  }
}


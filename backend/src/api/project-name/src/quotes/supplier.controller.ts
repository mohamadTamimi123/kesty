import { Controller, Get, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { SupplierStatsService } from '../common/services/supplier-stats.service';

@Controller('supplier')
@UseGuards(JwtAuthGuard)
export class SupplierController {
  constructor(private readonly supplierStatsService: SupplierStatsService) {}

  @Get('stats')
  @Roles(UserRole.SUPPLIER)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  async getStats(@Request() req) {
    return this.supplierStatsService.getSupplierStats(req.user.id);
  }
}


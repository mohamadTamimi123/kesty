import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { AdminStatsService } from './common/services/admin-stats.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { Roles } from './common/decorators/roles.decorator';
import { UserRole } from './users/entities/user.entity';

export class ContactDto {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly adminStatsService: AdminStatsService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('contact')
  async submitContact(@Body() contactData: ContactDto) {
    return this.appService.handleContact(contactData);
  }

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAdminStats() {
    return this.adminStatsService.getDashboardStats();
  }

  @Get('admin/analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAnalytics(@Body() body?: { startDate?: string; endDate?: string }) {
    const startDate = body?.startDate ? new Date(body.startDate) : undefined;
    const endDate = body?.endDate ? new Date(body.endDate) : undefined;
    return this.adminStatsService.getAnalyticsStats(startDate, endDate);
  }
}

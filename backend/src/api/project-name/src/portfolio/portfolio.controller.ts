import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
  Query,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { PortfolioService } from './portfolio.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';

@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPPLIER)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createPortfolioDto: CreatePortfolioDto,
    @CurrentUser() supplier: User,
  ) {
    return this.portfolioService.create(createPortfolioDto, supplier);
  }

  @Get('my-portfolios')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPPLIER)
  async getMyPortfolios(@CurrentUser() supplier: User) {
    return this.portfolioService.findBySupplier(supplier.id);
  }

  @Get('supplier/:supplierId')
  async getSupplierPortfolios(@Param('supplierId') supplierId: string) {
    return this.portfolioService.findPublic(supplierId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const portfolio = await this.portfolioService.findOne(id);
    await this.portfolioService.incrementViewCount(id);
    return portfolio;
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPPLIER)
  async update(
    @Param('id') id: string,
    @Body() updatePortfolioDto: UpdatePortfolioDto,
    @CurrentUser() supplier: User,
  ) {
    return this.portfolioService.update(id, updatePortfolioDto, supplier);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPPLIER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser() supplier: User) {
    await this.portfolioService.remove(id, supplier);
  }

  @Post(':id/request-review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPPLIER)
  async requestReview(
    @Param('id') portfolioId: string,
    @Body() body: { customerId: string; message?: string },
    @CurrentUser() supplier: User,
  ) {
    await this.portfolioService.requestReview(
      portfolioId,
      body.customerId,
      supplier,
      body.message,
    );
    return { message: 'Review request sent successfully' };
  }
}


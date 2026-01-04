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
  ParseFilePipe,
  MaxFileSizeValidator,
  BadRequestException,
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
import { ConfigService } from '@nestjs/config';
import { PaginationDto } from '../common/dto/pagination.dto';

// Type definition for multer file
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

@Controller('portfolio')
export class PortfolioController {
  constructor(
    private readonly portfolioService: PortfolioService,
    private readonly configService: ConfigService,
  ) {}

  @Post('upload-images')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPPLIER)
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads', 'portfolios');
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `portfolio-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
          'image/gif',
        ];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('فقط فایل‌های تصویری مجاز است'), false);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB per image
      },
    }),
  )
  async uploadImages(
    @CurrentUser() user: User,
    @UploadedFiles(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
        ],
      }),
    )
    files: MulterFile[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('حداقل یک تصویر الزامی است');
    }

    if (files.length > 10) {
      throw new BadRequestException('حداکثر 10 تصویر مجاز است');
    }

    const apiPrefix = this.configService.get('API_PREFIX', '/api') as string;
    const imageUrls = files.map(
      (file) => `${apiPrefix}/uploads/portfolios/${file.filename}`,
    );

    return {
      imageUrls,
      count: imageUrls.length,
    };
  }

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

  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getPendingPortfolios(@Query() pagination: PaginationDto) {
    return this.portfolioService.findPending(
      pagination.page || 1,
      pagination.limit || 20,
    );
  }

  @Get('supplier/:supplierId')
  async getSupplierPortfolios(@Param('supplierId') supplierId: string) {
    return this.portfolioService.findPublic(supplierId);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPPLIER)
  async getStats(@CurrentUser() supplier: User) {
    return this.portfolioService.getStats(supplier.id);
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

  // Admin endpoints
  @Put(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async verifyPortfolio(@Param('id') id: string) {
    return this.portfolioService.verify(id);
  }

  @Put(':id/unverify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async unverifyPortfolio(@Param('id') id: string) {
    return this.portfolioService.unverify(id);
  }
}


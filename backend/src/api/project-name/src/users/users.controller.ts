import {
  Controller,
  Get,
  Put,
  Post,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Query,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { extname } from 'path';
import { UsersService } from './users.service';
import { CategoriesService } from '../categories/categories.service';
import { Portfolio } from '../portfolio/entities/portfolio.entity';
import { Review } from '../reviews/entities/review.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from './entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from './entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ConfigService } from '@nestjs/config';

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

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  @Put('me/profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateMyProfile(
    @CurrentUser() user: User,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const updateData: Partial<User> = {};
    
    if (updateProfileDto.fullName) updateData.fullName = updateProfileDto.fullName;
    if (updateProfileDto.phone) updateData.phone = updateProfileDto.phone;
    if (updateProfileDto.email !== undefined) updateData.email = updateProfileDto.email;
    if (updateProfileDto.workshopName) updateData.workshopName = updateProfileDto.workshopName;
    if (updateProfileDto.workshopAddress) updateData.workshopAddress = updateProfileDto.workshopAddress;
    if (updateProfileDto.workshopPhone !== undefined) updateData.workshopPhone = updateProfileDto.workshopPhone;
    if (updateProfileDto.address) updateData.address = updateProfileDto.address;
    if (updateProfileDto.city) updateData.city = updateProfileDto.city;
    if (updateProfileDto.bio) updateData.bio = updateProfileDto.bio;
    
    // Store specialties and experience in metadata
    if (updateProfileDto.specialties || updateProfileDto.experience) {
      updateData.metadata = {
        ...(user.metadata || {}),
        ...(updateProfileDto.specialties && { specialties: updateProfileDto.specialties }),
        ...(updateProfileDto.experience && { experience: updateProfileDto.experience }),
      };
    }

    const updatedUser = await this.usersService.update(user.id, updateData);
    
    // Return safe user data
    return {
      id: updatedUser.id,
      phone: updatedUser.phone,
      email: updatedUser.email,
      fullName: updatedUser.fullName,
      role: updatedUser.role,
      workshopName: updatedUser.workshopName,
      workshopAddress: updatedUser.workshopAddress,
      workshopPhone: updatedUser.workshopPhone,
      address: updatedUser.address,
      city: updatedUser.city,
      bio: updatedUser.bio,
      metadata: updatedUser.metadata,
      avatarUrl: updatedUser.avatarUrl,
      updatedAt: updatedUser.updatedAt,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getMyProfile(@CurrentUser() user: User) {
    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      workshopName: user.workshopName,
      workshopAddress: user.workshopAddress,
      workshopPhone: user.workshopPhone,
      address: user.address,
      city: user.city,
      bio: user.bio,
      metadata: user.metadata,
      avatarUrl: user.avatarUrl,
      profileImageUrl: user.profileImageUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  @Post('me/profile-image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads', 'profiles');
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `profile-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('فقط فایل‌های تصویری مجاز هستند (JPG, PNG, WebP)'), false);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  @HttpCode(HttpStatus.OK)
  async uploadProfileImage(
    @CurrentUser() user: User,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
        ],
      }),
    )
    file: MulterFile,
  ) {
    const apiPrefix = this.configService.get('API_PREFIX', '/api') as string;
    const imageUrl = `${apiPrefix}/uploads/profiles/${file.filename}`;
    
    // Update user's avatarUrl and profileImageUrl
    const updatedUser = await this.usersService.update(user.id, {
      avatarUrl: imageUrl,
      profileImageUrl: imageUrl,
    });

    return {
      imageUrl,
      avatarUrl: updatedUser.avatarUrl,
      profileImageUrl: updatedUser.profileImageUrl,
    };
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async searchUsers(
    @Query('q') query?: string,
    @Query('role') role?: string,
    @Query('limit') limit?: string,
  ) {
    const roleEnum = role ? (role.toUpperCase() as UserRole) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    
    const users = await this.usersService.searchUsers(
      query || '',
      roleEnum,
      limitNum,
    );

    // Return safe user data (public info only)
    return users.map((user) => ({
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      avatarUrl: user.avatarUrl,
    }));
  }
}

@Controller('suppliers')
export class SuppliersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly categoriesService: CategoriesService,
    @InjectRepository(Portfolio)
    private portfolioRepository: Repository<Portfolio>,
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getPublicSuppliers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('cityId') cityId?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    const pageNum = parseInt(page || '1', 10);
    const limitNum = parseInt(limit || '20', 10);
    const skip = (pageNum - 1) * limitNum;

    // Get all active suppliers
    const suppliers = await this.usersService.findSuppliers({
      skip,
      take: limitNum,
      search,
      cityId,
      categoryId,
    });

    // Get total count for pagination
    const total = await this.usersService.countSuppliers({
      search,
      cityId,
      categoryId,
    });

    // Return safe supplier data (public info only)
    return {
      data: suppliers.map((supplier) => ({
        id: supplier.id,
        fullName: supplier.fullName,
        workshopName: supplier.workshopName,
        profileImageUrl: supplier.profileImageUrl,
        avatarUrl: supplier.avatarUrl,
        bio: supplier.bio,
        city: supplier.city ? { title: supplier.city } : null,
        metadata: supplier.metadata,
        slug: this.usersService.generateSlugForSupplier(supplier),
        createdAt: supplier.createdAt,
      })),
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  @Get(':slug')
  @HttpCode(HttpStatus.OK)
  async getSupplierBySlug(@Param('slug') slug: string) {
    // Check if slug is a UUID (ID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    
    let supplier;
    if (isUUID) {
      // If it's a UUID, try to find supplier by ID
      supplier = await this.usersService.findById(slug);
      // Verify it's a supplier and active
      if (supplier && (supplier.role !== UserRole.SUPPLIER || !supplier.isActive)) {
        supplier = null;
      }
    } else {
      // Use slug normally
      supplier = await this.usersService.findSupplierBySlug(slug);
    }
    
    if (!supplier) {
      throw new NotFoundException('تولیدکننده یافت نشد');
    }

    // Get related data
    const [categories, portfolios, reviews] = await Promise.all([
      this.categoriesService.getCategoriesForSupplier(supplier.id),
      this.portfolioRepository.find({
        where: { supplierId: supplier.id, isPublic: true },
        order: { createdAt: 'DESC' },
        take: 10,
      }),
      this.reviewRepository.find({
        where: { supplierId: supplier.id },
        relations: ['customer'],
        order: { createdAt: 'DESC' },
        take: 10,
      }),
    ]);

    return {
      ...supplier,
      categories,
      portfolios,
      reviews,
    };
  }
}

@Controller('customers')
export class CustomersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getPublicCustomerById(@Param('id') id: string) {
    const customer = await this.usersService.findById(id);
    
    if (!customer) {
      throw new NotFoundException('مشتری یافت نشد');
    }
    
    // Verify it's a customer
    if (customer.role !== UserRole.CUSTOMER) {
      throw new NotFoundException('مشتری یافت نشد');
    }
    
    // Return safe customer data (public info only)
    return {
      id: customer.id,
      fullName: customer.fullName,
      phone: customer.phone,
      email: customer.email,
      workshopName: customer.workshopName,
      workshopAddress: customer.workshopAddress,
      workshopPhone: customer.workshopPhone,
      address: customer.address,
      city: customer.city,
      bio: customer.bio,
      profileImageUrl: customer.profileImageUrl,
      avatarUrl: customer.avatarUrl,
      createdAt: customer.createdAt,
    };
  }
}

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
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

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

@Controller('admin/categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminCategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllCategories() {
    const categories = await this.categoriesService.findAll();
    return categories;
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getCategoryById(@Param('id') id: string) {
    const category = await this.categoriesService.findById(id);
    if (!category) {
      throw new NotFoundException('کتگوری یافت نشد');
    }
    return category;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('icon', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads', 'categories');
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `category-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
        // Some browsers send image/jpg instead of image/jpeg
        if (allowedMimes.includes(file.mimetype) || file.mimetype === 'image/jpg') {
          cb(null, true);
        } else {
          cb(new Error('فقط فایل‌های تصویری مجاز هستند (JPG, PNG, WebP, SVG)'), false);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async createCategory(
    @Body() createCategoryDto: CreateCategoryDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
        ],
      }),
    )
    file?: MulterFile,
  ) {
    let iconUrl: string | undefined;
    if (file) {
      iconUrl = `/uploads/categories/${file.filename}`;
    }

    const category = await this.categoriesService.create({
      title: createCategoryDto.title,
      slug: createCategoryDto.slug,
      description: createCategoryDto.description,
      iconUrl,
      metaTitle: createCategoryDto.metaTitle,
      metaDescription: createCategoryDto.metaDescription,
    });

    return category;
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('icon', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads', 'categories');
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `category-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
        // Some browsers send image/jpg instead of image/jpeg
        if (allowedMimes.includes(file.mimetype) || file.mimetype === 'image/jpg') {
          cb(null, true);
        } else {
          cb(new Error('فقط فایل‌های تصویری مجاز هستند (JPG, PNG, WebP, SVG)'), false);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
        ],
      }),
    )
    file?: MulterFile,
  ) {
    const category = await this.categoriesService.findById(id);
    if (!category) {
      throw new NotFoundException('کتگوری یافت نشد');
    }

    const updateData: any = { ...updateCategoryDto };

    if (file) {
      updateData.iconUrl = `/uploads/categories/${file.filename}`;
    }

    const updatedCategory = await this.categoriesService.update(id, updateData);
    return updatedCategory;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteCategory(@Param('id') id: string) {
    await this.categoriesService.delete(id);
    return { message: 'کتگوری با موفقیت حذف شد' };
  }
}


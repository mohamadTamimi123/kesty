import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { EducationalArticlesService } from './educational-articles.service';
import { CreateEducationalArticleDto } from './dto/create-educational-article.dto';
import { UpdateEducationalArticleDto } from './dto/update-educational-article.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
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

@Controller('educational-articles')
export class EducationalArticlesController {
  constructor(
    private readonly educationalArticlesService: EducationalArticlesService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  create(@Body() createDto: CreateEducationalArticleDto) {
    return this.educationalArticlesService.create(createDto);
  }

  @Get()
  findAll(@Query('published') published?: string) {
    const isPublished = published === 'true' ? true : published === 'false' ? false : undefined;
    return this.educationalArticlesService.findAll(isPublished);
  }

  @Get('popular')
  getPopular(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.educationalArticlesService.getPopular(limitNum);
  }

  @Get('category/:categoryId')
  findByCategory(@Param('categoryId') categoryId: string) {
    return this.educationalArticlesService.findByCategory(categoryId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.educationalArticlesService.findOne(id);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.educationalArticlesService.findBySlug(slug);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateEducationalArticleDto) {
    return this.educationalArticlesService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.educationalArticlesService.remove(id);
  }

  @Post('upload-featured-image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads', 'articles');
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `article-${uniqueSuffix}${ext}`);
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
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  @HttpCode(HttpStatus.OK)
  async uploadFeaturedImage(
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
    const imageUrl = `${apiPrefix}/uploads/articles/${file.filename}`;

    return {
      imageUrl,
    };
  }
}


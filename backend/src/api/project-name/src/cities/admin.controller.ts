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
import { existsSync, mkdirSync } from 'fs';
import { CitiesService } from './cities.service';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('admin/cities')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminCitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllCities() {
    const cities = await this.citiesService.findAll();
    return cities;
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getCityById(@Param('id') id: string) {
    const city = await this.citiesService.findById(id);
    if (!city) {
      throw new NotFoundException('شهر یافت نشد');
    }
    return city;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads', 'cities');
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `city-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
        // Some browsers send image/jpg instead of image/jpeg
        if (allowedMimes.includes(file.mimetype) || file.mimetype === 'image/jpg') {
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
  async createCity(
    @Body() createCityDto: CreateCityDto,
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
    let logoUrl: string | undefined;
    if (file) {
      logoUrl = `/uploads/cities/${file.filename}`;
    }

    const city = await this.citiesService.create({
      title: createCityDto.title,
      slug: createCityDto.slug,
      description: createCityDto.description,
      logoUrl,
    });

    return city;
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads', 'cities');
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `city-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
        // Some browsers send image/jpg instead of image/jpeg
        if (allowedMimes.includes(file.mimetype) || file.mimetype === 'image/jpg') {
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
  async updateCity(
    @Param('id') id: string,
    @Body() updateCityDto: UpdateCityDto,
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
    const city = await this.citiesService.findById(id);
    if (!city) {
      throw new NotFoundException('شهر یافت نشد');
    }

    const updateData: any = { ...updateCityDto };

    if (file) {
      updateData.logoUrl = `/uploads/cities/${file.filename}`;
    }

    const updatedCity = await this.citiesService.update(id, updateData);
    return updatedCity;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteCity(@Param('id') id: string) {
    await this.citiesService.delete(id);
    return { message: 'شهر با موفقیت حذف شد' };
  }
}


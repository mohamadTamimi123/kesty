import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
  ParseFilePipe,
  MaxFileSizeValidator,
  NotFoundException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { PaginationDto } from '../common/dto/pagination.dto';
import { RateLimitInterceptor } from '../common/interceptors/rate-limit.interceptor';

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

@Controller('projects')
@UseGuards(JwtAuthGuard)
@UseInterceptors(RateLimitInterceptor)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads', 'projects');
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `project-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'image/jpeg',
          'image/png',
          'image/webp',
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];
        if (allowedMimes.includes(file.mimetype) || file.mimetype === 'image/jpg') {
          cb(null, true);
        } else {
          cb(new Error('نوع فایل مجاز نیست'), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async createProject(
    @Body() createProjectDto: CreateProjectDto,
    @CurrentUser() user: User,
    @UploadedFiles(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
        ],
      }),
    )
    files?: MulterFile[],
  ) {
    const project = await this.projectsService.create({
      ...createProjectDto,
      customerId: user.id,
    });

    // Add files if provided
    if (files && files.length > 0) {
      for (const file of files) {
        await this.projectsService.addFile(project.id, {
          fileUrl: `/uploads/projects/${file.filename}`,
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
        });
      }
    }

    return await this.projectsService.findById(project.id);
  }

  @Get('my')
  @HttpCode(HttpStatus.OK)
  async getMyProjects(
    @CurrentUser() user: User,
    @Query() pagination: PaginationDto,
  ) {
    return this.projectsService.findByCustomer(
      user.id,
      pagination.page || 1,
      pagination.limit || 10,
    );
  }

  @Get('public')
  @HttpCode(HttpStatus.OK)
  async getPublicProjects(@Query() pagination: PaginationDto) {
    return this.projectsService.findPublic(
      pagination.page || 1,
      pagination.limit || 10,
    );
  }

  @Get('all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async getAllProjects(@Query() pagination: PaginationDto) {
    return this.projectsService.findAll(
      pagination.page || 1,
      pagination.limit || 100,
    );
  }

  @Post('batch')
  @HttpCode(HttpStatus.OK)
  async getProjectsBatch(@Body() body: { ids: string[] }) {
    if (!body.ids || !Array.isArray(body.ids)) {
      throw new NotFoundException('لیست شناسه‌های پروژه معتبر نیست');
    }
    const projects = await this.projectsService.findByIds(body.ids);
    return projects;
  }

  @Get('relevant-for-supplier')
  @HttpCode(HttpStatus.OK)
  async getRelevantProjectsForSupplier(
    @Query('categoryIds') categoryIds?: string,
    @Query('cityIds') cityIds?: string,
    @Query('subCategoryIds') subCategoryIds?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
    @Query('cursor') cursor?: string,
  ) {
    const categoryIdsArray = categoryIds ? categoryIds.split(',').filter(Boolean) : [];
    const cityIdsArray = cityIds ? cityIds.split(',').filter(Boolean) : [];
    const subCategoryIdsArray = subCategoryIds ? subCategoryIds.split(',').filter(Boolean) : [];
    const limitNum = limit ? Math.min(parseInt(limit, 10), 50) : 10; // Default 10, max 50
    const pageNum = page ? parseInt(page, 10) : 1;

    return this.projectsService.findRelevantForSupplier(
      categoryIdsArray,
      cityIdsArray,
      subCategoryIdsArray,
      limitNum,
      pageNum,
      cursor,
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getProjectById(@Param('id') id: string) {
    const project = await this.projectsService.findById(id);
    if (!project) {
      throw new NotFoundException('پروژه یافت نشد');
    }
    return project;
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateProject(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @CurrentUser() user: User,
  ) {
    return this.projectsService.update(id, updateProjectDto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteProject(@Param('id') id: string, @CurrentUser() user: User) {
    await this.projectsService.delete(id, user.id);
    return { message: 'پروژه با موفقیت حذف شد' };
  }
}


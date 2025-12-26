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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

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
  async getMyProjects(@CurrentUser() user: User) {
    return this.projectsService.findByCustomer(user.id);
  }

  @Get('public')
  @HttpCode(HttpStatus.OK)
  async getPublicProjects() {
    return this.projectsService.findPublic();
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


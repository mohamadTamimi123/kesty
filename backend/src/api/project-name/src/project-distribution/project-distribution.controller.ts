import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ProjectDistributionService } from './project-distribution.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../projects/entities/project.entity';

@Controller('project-distribution')
@UseGuards(JwtAuthGuard)
export class ProjectDistributionController {
  constructor(
    private readonly projectDistributionService: ProjectDistributionService,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
  ) {}

  @Post(':projectId/distribute')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async distributeProject(@Param('projectId') projectId: string) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('پروژه یافت نشد');
    }

    await this.projectDistributionService.distributeProject(projectId);
    return {
      message: 'پروژه با موفقیت به تولیدکنندگان مرتبط ارسال شد',
      projectId,
    };
  }

  @Get(':projectId/relevant-suppliers')
  @HttpCode(HttpStatus.OK)
  async getRelevantSuppliers(@Param('projectId') projectId: string) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('پروژه یافت نشد');
    }

    const suppliers = await this.projectDistributionService.getRelevantSuppliers(projectId);
    return {
      projectId,
      suppliers: suppliers.map((supplier) => ({
        id: supplier.id,
        fullName: supplier.fullName,
        workshopName: supplier.workshopName,
        phone: supplier.phone,
        email: supplier.email,
        city: supplier.city,
      })),
      count: suppliers.length,
    };
  }

  @Get(':projectId/excluded-suppliers')
  @HttpCode(HttpStatus.OK)
  async getExcludedSuppliers(@Param('projectId') projectId: string) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('پروژه یافت نشد');
    }

    const excludedSuppliers = await this.projectDistributionService.getExcludedSuppliers(projectId);
    return {
      projectId,
      excludedSuppliers,
      count: excludedSuppliers.length,
    };
  }
}


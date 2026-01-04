import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { Project } from './entities/project.entity';
import { ProjectFile } from './entities/project-file.entity';
import { ProjectDistributionModule } from '../project-distribution/project-distribution.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, ProjectFile]),
    forwardRef(() => ProjectDistributionModule),
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}


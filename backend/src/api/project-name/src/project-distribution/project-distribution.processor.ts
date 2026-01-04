import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { ProjectDistributionService } from './project-distribution.service';
import { DistributeProjectJobDto } from './dto/distribute-project-job.dto';

@Processor('project-distribution')
export class ProjectDistributionProcessor {
  private readonly logger = new Logger(ProjectDistributionProcessor.name);

  constructor(
    private readonly projectDistributionService: ProjectDistributionService,
  ) {}

  @Process('distribute-project')
  async handleDistributeProject(job: Job<DistributeProjectJobDto>) {
    const { projectId } = job.data;
    
    this.logger.log(`Processing project distribution for project ${projectId} (Job ID: ${job.id})`);

    try {
      await this.projectDistributionService.distributeProject(projectId);
      
      this.logger.log(
        `Successfully distributed project ${projectId} (Job ID: ${job.id})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to distribute project ${projectId} (Job ID: ${job.id}): ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      
      // Re-throw to trigger retry mechanism
      throw error;
    }
  }
}


import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChangelogService } from './changelog.service';
import { ChangelogController } from './changelog.controller';
import { ChangelogTask } from './entities/changelog-task.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChangelogTask])],
  controllers: [ChangelogController],
  providers: [ChangelogService],
  exports: [ChangelogService],
})
export class ChangelogModule {}


import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ChangelogService, ChangelogFilters } from './changelog.service';
import { CreateChangelogTaskDto } from './dto/create-changelog-task.dto';
import { UpdateChangelogTaskDto } from './dto/update-changelog-task.dto';
import {
  TaskStatus,
  ChangeType,
  TestStatus,
} from './entities/changelog-task.entity';

@Controller('changelog')
export class ChangelogController {
  constructor(private readonly changelogService: ChangelogService) {}

  @Post()
  create(@Body() createDto: CreateChangelogTaskDto) {
    return this.changelogService.create(createDto);
  }

  @Get()
  findAll(
    @Query('status') status?: TaskStatus,
    @Query('changeType') changeType?: ChangeType,
    @Query('relatedModule') relatedModule?: string,
    @Query('testStatus') testStatus?: TestStatus,
    @Query('search') search?: string,
  ) {
    const filters: ChangelogFilters = {};
    if (status) filters.status = status;
    if (changeType) filters.changeType = changeType;
    if (relatedModule) filters.relatedModule = relatedModule;
    if (testStatus) filters.testStatus = testStatus;
    if (search) filters.search = search;

    return this.changelogService.findAll(filters);
  }

  @Get('stats')
  getStats() {
    return this.changelogService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.changelogService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateChangelogTaskDto) {
    return this.changelogService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.changelogService.remove(id);
  }
}


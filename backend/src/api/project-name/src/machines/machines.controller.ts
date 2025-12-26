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
} from '@nestjs/common';
import { MachinesService } from './machines.service';
import { CreateMachineDto } from './dto/create-machine.dto';
import { UpdateMachineDto } from './dto/update-machine.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('machines')
export class MachinesController {
  constructor(private readonly machinesService: MachinesService) {}

  @Get()
  async findAll(@Query('categoryId') categoryId?: string) {
    return this.machinesService.findAll(categoryId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.machinesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createMachineDto: CreateMachineDto) {
    return this.machinesService.create(createMachineDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() updateMachineDto: UpdateMachineDto) {
    return this.machinesService.update(id, updateMachineDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.machinesService.remove(id);
  }

  @Get(':id/main-categories')
  @HttpCode(HttpStatus.OK)
  async getMachineMainCategories(@Param('id') id: string) {
    const mainCategories = await this.machinesService.getMainCategoriesForMachine(id);
    return {
      machineId: id,
      mainCategories,
    };
  }

  @Post(':id/main-categories/:categoryId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async addMainCategory(
    @Param('id') machineId: string,
    @Param('categoryId') categoryId: string,
  ) {
    return this.machinesService.addMainCategory(machineId, categoryId);
  }

  @Delete(':id/main-categories/:categoryId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMainCategory(
    @Param('id') machineId: string,
    @Param('categoryId') categoryId: string,
  ) {
    await this.machinesService.removeMainCategory(machineId, categoryId);
  }

  @Get('by-main-category/:categoryId')
  @HttpCode(HttpStatus.OK)
  async getMachinesByMainCategory(@Param('categoryId') categoryId: string) {
    return this.machinesService.findByMainCategory(categoryId);
  }
}


import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Machine } from './entities/machine.entity';
import { MachineMainCategory } from './entities/machine-main-category.entity';
import { MachineSupplier } from './entities/machine-supplier.entity';
import { Category } from '../categories/entities/category.entity';
import { CreateMachineDto } from './dto/create-machine.dto';
import { UpdateMachineDto } from './dto/update-machine.dto';

@Injectable()
export class MachinesService {
  constructor(
    @InjectRepository(Machine)
    private machineRepository: Repository<Machine>,
    @InjectRepository(MachineMainCategory)
    private machineMainCategoryRepository: Repository<MachineMainCategory>,
    @InjectRepository(MachineSupplier)
    private machineSupplierRepository: Repository<MachineSupplier>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async create(createMachineDto: CreateMachineDto): Promise<Machine> {
    const machine = this.machineRepository.create(createMachineDto);
    const savedMachine = await this.machineRepository.save(machine);

    // Auto-populate machine_main_category if sub_category_id is provided
    if (createMachineDto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: createMachineDto.categoryId },
        relations: ['parent'],
      });
      if (category && category.parent) {
        // Find main category (level 1)
        let mainCategory = category.parent;
        while (mainCategory && mainCategory.level > 1 && mainCategory.parentId) {
          const parentCategory = await this.categoryRepository.findOne({
            where: { id: mainCategory.parentId },
            relations: ['parent'],
          });
          if (parentCategory) {
            mainCategory = parentCategory;
          } else {
            break;
          }
        }
        if (mainCategory && mainCategory.level === 1) {
          await this.addMainCategory(savedMachine.id, mainCategory.id);
        }
      }
    }

    return savedMachine;
  }

  async findAll(categoryId?: string): Promise<Machine[]> {
    const query = this.machineRepository
      .createQueryBuilder('machine')
      .where('machine.isActive = :isActive', { isActive: true });

    if (categoryId) {
      query.andWhere('machine.categoryId = :categoryId', { categoryId });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Machine> {
    const machine = await this.machineRepository.findOne({ where: { id } });

    if (!machine) {
      throw new NotFoundException(`Machine with ID ${id} not found`);
    }

    return machine;
  }

  async update(id: string, updateMachineDto: UpdateMachineDto): Promise<Machine> {
    const machine = await this.findOne(id);
    Object.assign(machine, updateMachineDto);
    return this.machineRepository.save(machine);
  }

  async remove(id: string): Promise<void> {
    const machine = await this.findOne(id);
    await this.machineRepository.remove(machine);
  }

  async findByCategory(categoryId: string): Promise<Machine[]> {
    return this.machineRepository.find({
      where: { categoryId, isActive: true },
    });
  }

  /**
   * Add main category to machine
   */
  async addMainCategory(machineId: string, mainCategoryId: string): Promise<MachineMainCategory> {
    const machine = await this.findOne(machineId);
    
    // Check if relationship already exists
    const existing = await this.machineMainCategoryRepository.findOne({
      where: { machineId, mainCategoryId },
    });
    if (existing) {
      return existing;
    }

    const machineMainCategory = this.machineMainCategoryRepository.create({
      machineId,
      mainCategoryId,
    });

    return await this.machineMainCategoryRepository.save(machineMainCategory);
  }

  /**
   * Remove main category from machine
   */
  async removeMainCategory(machineId: string, mainCategoryId: string): Promise<void> {
    const result = await this.machineMainCategoryRepository.delete({
      machineId,
      mainCategoryId,
    });
    if (result.affected === 0) {
      throw new NotFoundException('رابطه ماشین و دسته اصلی یافت نشد');
    }
  }

  /**
   * Get machines by main category
   */
  async findByMainCategory(mainCategoryId: string): Promise<Machine[]> {
    const machineMainCategories = await this.machineMainCategoryRepository.find({
      where: { mainCategoryId },
      relations: ['machine'],
    });
    return machineMainCategories.map((mmc) => mmc.machine).filter((m) => m.isActive);
  }

  /**
   * Add machine to supplier
   */
  async addMachineToSupplier(machineId: string, supplierId: string): Promise<MachineSupplier> {
    const machine = await this.findOne(machineId);

    // Check if relationship already exists
    const existing = await this.machineSupplierRepository.findOne({
      where: { machineId, supplierId },
    });
    if (existing) {
      return existing;
    }

    const machineSupplier = this.machineSupplierRepository.create({
      machineId,
      supplierId,
    });

    return await this.machineSupplierRepository.save(machineSupplier);
  }

  /**
   * Remove machine from supplier
   */
  async removeMachineFromSupplier(machineId: string, supplierId: string): Promise<void> {
    const result = await this.machineSupplierRepository.delete({
      machineId,
      supplierId,
    });
    if (result.affected === 0) {
      throw new NotFoundException('رابطه ماشین و تولیدکننده یافت نشد');
    }
  }

  /**
   * Get machines for a supplier
   */
  async getMachinesForSupplier(supplierId: string): Promise<Machine[]> {
    const machineSuppliers = await this.machineSupplierRepository.find({
      where: { supplierId },
      relations: ['machine'],
    });
    return machineSuppliers.map((ms) => ms.machine).filter((m) => m.isActive);
  }

  /**
   * Get suppliers for a machine
   */
  async getSuppliersForMachine(machineId: string): Promise<string[]> {
    const machineSuppliers = await this.machineSupplierRepository.find({
      where: { machineId },
    });
    return machineSuppliers.map((ms) => ms.supplierId);
  }

  /**
   * Get main categories for a machine
   */
  async getMainCategoriesForMachine(machineId: string): Promise<Category[]> {
    await this.findOne(machineId); // Verify machine exists
    const machineMainCategories = await this.machineMainCategoryRepository.find({
      where: { machineId },
      relations: ['mainCategory'],
    });
    return machineMainCategories.map((mmc) => mmc.mainCategory);
  }
}


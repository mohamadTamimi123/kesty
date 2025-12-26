import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Material } from './entities/material.entity';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

@Injectable()
export class MaterialsService {
  constructor(
    @InjectRepository(Material)
    private materialRepository: Repository<Material>,
  ) {}

  async create(createMaterialDto: CreateMaterialDto): Promise<Material> {
    const material = this.materialRepository.create(createMaterialDto);
    return this.materialRepository.save(material);
  }

  async findAll(categoryId?: string): Promise<Material[]> {
    const query = this.materialRepository
      .createQueryBuilder('material')
      .where('material.isActive = :isActive', { isActive: true });

    if (categoryId) {
      query.andWhere('material.categoryId = :categoryId', { categoryId });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Material> {
    const material = await this.materialRepository.findOne({ where: { id } });

    if (!material) {
      throw new NotFoundException(`Material with ID ${id} not found`);
    }

    return material;
  }

  async update(id: string, updateMaterialDto: UpdateMaterialDto): Promise<Material> {
    const material = await this.findOne(id);
    Object.assign(material, updateMaterialDto);
    return this.materialRepository.save(material);
  }

  async remove(id: string): Promise<void> {
    const material = await this.findOne(id);
    await this.materialRepository.remove(material);
  }

  async findByCategory(categoryId: string): Promise<Material[]> {
    return this.materialRepository.find({
      where: { categoryId, isActive: true },
    });
  }
}


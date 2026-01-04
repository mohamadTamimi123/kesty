import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Portfolio } from './entities/portfolio.entity';
import { PortfolioImage } from './entities/portfolio-image.entity';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { User } from '../users/entities/user.entity';
import { Machine } from '../machines/entities/machine.entity';
import { Material } from '../materials/entities/material.entity';

@Injectable()
export class PortfolioService {
  constructor(
    @InjectRepository(Portfolio)
    private portfolioRepository: Repository<Portfolio>,
    @InjectRepository(PortfolioImage)
    private portfolioImageRepository: Repository<PortfolioImage>,
    @InjectRepository(Machine)
    private machineRepository: Repository<Machine>,
    @InjectRepository(Material)
    private materialRepository: Repository<Material>,
  ) {}

  async create(
    createPortfolioDto: CreatePortfolioDto,
    supplier: User,
  ): Promise<Portfolio> {
    const portfolio = this.portfolioRepository.create({
      ...createPortfolioDto,
      supplierId: supplier.id,
      completionDate: new Date(createPortfolioDto.completionDate),
    });

    // Handle machines
    if (createPortfolioDto.machineIds && createPortfolioDto.machineIds.length > 0) {
      const machines = await this.machineRepository.find({
        where: createPortfolioDto.machineIds.map((id) => ({ id })),
      });
      portfolio.machines = machines;
    }

    // Handle materials
    if (createPortfolioDto.materialIds && createPortfolioDto.materialIds.length > 0) {
      const materials = await this.materialRepository.find({
        where: createPortfolioDto.materialIds.map((id) => ({ id })),
      });
      portfolio.materials = materials;
    }

    const savedPortfolio = await this.portfolioRepository.save(portfolio);

    // Handle images
    if (createPortfolioDto.images && createPortfolioDto.images.length > 0) {
      const images = createPortfolioDto.images.map((img, index) =>
        this.portfolioImageRepository.create({
          portfolioId: savedPortfolio.id,
          imageUrl: img.imageUrl,
          order: img.order ?? index,
          isPrimary: img.isPrimary ?? index === 0,
        }),
      );
      await this.portfolioImageRepository.save(images);
    }

    return this.findOne(savedPortfolio.id);
  }

  async update(
    id: string,
    updatePortfolioDto: UpdatePortfolioDto,
    supplier: User,
  ): Promise<Portfolio> {
    const portfolio = await this.findOne(id);

    if (portfolio.supplierId !== supplier.id) {
      throw new ForbiddenException('You can only update your own portfolios');
    }

    // Update basic fields
    Object.assign(portfolio, {
      ...updatePortfolioDto,
      completionDate: updatePortfolioDto.completionDate
        ? new Date(updatePortfolioDto.completionDate)
        : portfolio.completionDate,
    });

    // Update machines
    if (updatePortfolioDto.machineIds !== undefined) {
      if (updatePortfolioDto.machineIds.length > 0) {
        const machines = await this.machineRepository.find({
          where: updatePortfolioDto.machineIds.map((id) => ({ id })),
        });
        portfolio.machines = machines;
      } else {
        portfolio.machines = [];
      }
    }

    // Update materials
    if (updatePortfolioDto.materialIds !== undefined) {
      if (updatePortfolioDto.materialIds.length > 0) {
        const materials = await this.materialRepository.find({
          where: updatePortfolioDto.materialIds.map((id) => ({ id })),
        });
        portfolio.materials = materials;
      } else {
        portfolio.materials = [];
      }
    }

    const savedPortfolio = await this.portfolioRepository.save(portfolio);

    // Handle images update
    if (updatePortfolioDto.images !== undefined) {
      // Delete existing images
      await this.portfolioImageRepository.delete({ portfolioId: savedPortfolio.id });

      // Create new images
      if (updatePortfolioDto.images.length > 0) {
        const images = updatePortfolioDto.images.map((img, index) =>
          this.portfolioImageRepository.create({
            portfolioId: savedPortfolio.id,
            imageUrl: img.imageUrl,
            order: img.order ?? index,
            isPrimary: img.isPrimary ?? index === 0,
          }),
        );
        await this.portfolioImageRepository.save(images);
      }
    }

    return this.findOne(savedPortfolio.id);
  }

  async remove(id: string, supplier: User): Promise<void> {
    const portfolio = await this.findOne(id);

    if (portfolio.supplierId !== supplier.id) {
      throw new ForbiddenException('You can only delete your own portfolios');
    }

    await this.portfolioRepository.remove(portfolio);
  }

  async findBySupplier(supplierId: string): Promise<Portfolio[]> {
    return this.portfolioRepository.find({
      where: { supplierId },
      relations: ['category', 'images', 'machines', 'materials'],
      order: { createdAt: 'DESC' },
    });
  }

  async findPublic(supplierId?: string): Promise<Portfolio[]> {
    const query = this.portfolioRepository
      .createQueryBuilder('portfolio')
      .where('portfolio.isPublic = :isPublic', { isPublic: true })
      .andWhere('portfolio.isVerified = :isVerified', { isVerified: true })
      .leftJoinAndSelect('portfolio.category', 'category')
      .leftJoinAndSelect('portfolio.images', 'images')
      .leftJoinAndSelect('portfolio.machines', 'machines')
      .leftJoinAndSelect('portfolio.materials', 'materials')
      .orderBy('portfolio.createdAt', 'DESC');

    if (supplierId) {
      query.andWhere('portfolio.supplierId = :supplierId', { supplierId });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Portfolio> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { id },
      relations: [
        'supplier',
        'category',
        'customer',
        'project',
        'images',
        'machines',
        'materials',
      ],
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${id} not found`);
    }

    return portfolio;
  }

  async requestReview(
    portfolioId: string,
    customerId: string,
    supplier: User,
    message?: string,
  ): Promise<void> {
    const portfolio = await this.findOne(portfolioId);

    if (portfolio.supplierId !== supplier.id) {
      throw new ForbiddenException('You can only request reviews for your own portfolios');
    }

    if (!portfolio.customerId) {
      throw new BadRequestException('Portfolio does not have a linked customer');
    }

    if (portfolio.customerId !== customerId) {
      throw new BadRequestException('Customer ID does not match portfolio customer');
    }

    // This will be handled by ReviewService
    // For now, we just validate
  }

  async calculateProfileCompletion(supplierId: string): Promise<number> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { supplierId },
      relations: ['images', 'machines', 'materials'],
    });

    // This is a simplified calculation
    // Full implementation should check all profile fields
    let score = 0;
    const maxScore = 100;

    // Basic info (25%)
    score += 25; // Assume basic info is filled

    // Profile images (15%)
    // This should check User entity fields
    score += 15;

    // Machine list (12%)
    // This should check machines count
    score += 12;

    // Materials (8%)
    // This should check materials count
    score += 8;

    // Gallery (40%)
    if (portfolio && portfolio.images && portfolio.images.length >= 3) {
      score += 40;
    } else {
      score += (portfolio?.images?.length || 0) * (40 / 3);
    }

    return Math.min(Math.round(score), maxScore);
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.portfolioRepository.increment({ id }, 'viewCount', 1);
  }

  async findPending(
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: Portfolio[]; total: number; page: number; limit: number; totalPages: number }> {
    const [data, total] = await this.portfolioRepository.findAndCount({
      where: { isVerified: false },
      relations: ['supplier', 'category', 'images'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async verify(id: string): Promise<Portfolio> {
    const portfolio = await this.findOne(id);
    portfolio.isVerified = true;
    return this.portfolioRepository.save(portfolio);
  }

  async unverify(id: string): Promise<Portfolio> {
    const portfolio = await this.findOne(id);
    portfolio.isVerified = false;
    return this.portfolioRepository.save(portfolio);
  }

  async getStats(supplierId: string): Promise<{
    total: number;
    totalViews: number;
    averageRating: number;
    verifiedCount: number;
    publicCount: number;
    recentPortfolios: Portfolio[];
    topPortfolios: Portfolio[];
  }> {
    const portfolios = await this.portfolioRepository.find({
      where: { supplierId },
      relations: ['category', 'images'],
      order: { createdAt: 'DESC' },
    });

    const total = portfolios.length;
    const totalViews = portfolios.reduce((sum, p) => sum + (p.viewCount || 0), 0);
    
    const ratings = portfolios
      .filter((p) => p.rating && p.rating > 0)
      .map((p) => p.rating!);
    const averageRating =
      ratings.length > 0
        ? Math.round((ratings.reduce((sum, r) => sum + r, 0) / ratings.length) * 10) / 10
        : 0;

    const verifiedCount = portfolios.filter((p) => p.isVerified).length;
    const publicCount = portfolios.filter((p) => p.isPublic).length;

    // Recent portfolios (last 3)
    const recentPortfolios = [...portfolios]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);

    // Top portfolios (by rating or views)
    const topPortfolios = [...portfolios]
      .sort((a, b) => {
        const aScore = (a.rating || 0) * 10 + (a.viewCount || 0);
        const bScore = (b.rating || 0) * 10 + (b.viewCount || 0);
        return bScore - aScore;
      })
      .slice(0, 3);

    return {
      total,
      totalViews,
      averageRating,
      verifiedCount,
      publicCount,
      recentPortfolios,
      topPortfolios,
    };
  }
}


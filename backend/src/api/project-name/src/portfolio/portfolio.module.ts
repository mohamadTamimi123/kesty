import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortfolioService } from './portfolio.service';
import { PortfolioController } from './portfolio.controller';
import { Portfolio } from './entities/portfolio.entity';
import { PortfolioImage } from './entities/portfolio-image.entity';
import { Machine } from '../machines/entities/machine.entity';
import { Material } from '../materials/entities/material.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Portfolio, PortfolioImage, Machine, Material]),
  ],
  controllers: [PortfolioController],
  providers: [PortfolioService],
  exports: [PortfolioService],
})
export class PortfolioModule {}


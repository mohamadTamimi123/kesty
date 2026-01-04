import { DataSource } from 'typeorm';
import { seedAdmin } from './admin.seed';
import { seedCities } from './cities.seed';
import { seedCategories } from './categories.seed';
import { seedMachines } from './machines.seed';
import { seedMaterials } from './materials.seed';
import { User } from '../../users/entities/user.entity';
import { City } from '../../cities/entities/city.entity';
import { Category } from '../../categories/entities/category.entity';
import { Machine } from '../../machines/entities/machine.entity';
import { Material } from '../../materials/entities/material.entity';
import { Project } from '../../projects/entities/project.entity';
import { ProjectFile } from '../../projects/entities/project-file.entity';
import { Portfolio } from '../../portfolio/entities/portfolio.entity';
import { PortfolioImage } from '../../portfolio/entities/portfolio-image.entity';
import { Review } from '../../reviews/entities/review.entity';
import { EducationalArticle } from '../../educational-articles/entities/educational-article.entity';
import { CategorySupplier } from '../../categories/entities/category-supplier.entity';
import { CitySupplier } from '../../cities/entities/city-supplier.entity';
import { SupplierRating } from '../../rating/entities/supplier-rating.entity';

async function runSeed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'keesti_db',
    entities: [
      User,
      City,
      Category,
      Machine,
      Material,
      Project,
      ProjectFile,
      Portfolio,
      PortfolioImage,
      Review,
      EducationalArticle,
      CategorySupplier,
      CitySupplier,
      SupplierRating,
    ],
    synchronize: false, // Tables are created manually, don't synchronize
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('Database connection established.');

    // Create uuid-ossp extension if it doesn't exist
    try {
      await dataSource.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      console.log('✓ UUID extension installed/verified.');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`⚠ Warning: Could not install uuid-ossp extension: ${errorMessage}`);
      // Continue anyway - TypeORM will use gen_random_uuid() as fallback
    }

    await seedAdmin(dataSource);
    await seedCities(dataSource);
    await seedCategories(dataSource);
    await seedMachines(dataSource);
    await seedMaterials(dataSource);
    
    // Check if comprehensive seeding is requested
    const shouldSeedComprehensive = process.env.SEED_COMPREHENSIVE === 'true';
    if (shouldSeedComprehensive) {
      console.log('\nStarting comprehensive seeding...');
      // Dynamic import to avoid compilation errors if comprehensive.seed.ts has issues
      const { seedComprehensive } = await import('./comprehensive.seed');
      await seedComprehensive(dataSource);
    }
    
    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    console.log('Database connection closed.');
  }
}

runSeed();

